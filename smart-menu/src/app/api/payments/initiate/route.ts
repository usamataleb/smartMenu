import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateCollection, detectProvider } from "@/lib/azampay";
import { z } from "zod";

const BodySchema = z.object({
  planId: z.string().min(1),
  phone: z.string().min(9, "Enter a valid phone number").max(15),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { planId, phone } = parsed.data;

  const [restaurant, plan] = await Promise.all([
    prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { subscription: true },
    }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ]);

  if (!restaurant || !plan) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const subscription = restaurant.subscription;
  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 400 });
  }

  // Cannot pay for free plan via Azampay
  if (plan.priceMonthly === 0) {
    return NextResponse.json({ error: "No payment required for the free plan" }, { status: 400 });
  }

  const billingPeriod = new Date().toISOString().slice(0, 7); // "2026-05"
  const amountTZS = plan.priceMonthly;

  // Create pending Payment record first so we have an ID for the externalId
  const payment = await prisma.payment.create({
    data: {
      restaurantId,
      subscriptionId: subscription.id,
      amountTZS,
      provider: detectProvider(phone),
      status: "pending",
      billingPeriod,
    },
  });

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/payments/callback`;

  try {
    const result = await initiateCollection({
      amount: amountTZS,
      phone,
      externalId: payment.id,
      provider: detectProvider(phone),
      callbackUrl,
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      transactionId: result.transactionId,
      message: result.message,
    });
  } catch (err) {
    // Mark the payment as failed if Azampay call fails
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    console.error("[azampay] initiate error:", err);
    return NextResponse.json(
      { error: "Payment initiation failed. Please try again." },
      { status: 502 }
    );
  }
}
