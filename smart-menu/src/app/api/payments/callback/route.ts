import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/azampay";
import { sendPaymentConfirmed } from "@/lib/email";

export async function POST(req: NextRequest) {
  // 1. Verify webhook signature
  if (!verifyWebhookSignature(req)) {
    console.warn("[payments/callback] Invalid callback token — rejected");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Azampay sends: { transactionStatus, message, reference, data: { ... } }
  const externalId = (body.reference as string) ?? (body.externalId as string);
  const transactionStatus = (body.transactionStatus as string)?.toLowerCase();
  const providerRef = (body.data as { transactionId?: string })?.transactionId ?? externalId;

  if (!externalId) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  // 2. Find payment by externalId (= Payment.id)
  const payment = await prisma.payment.findUnique({ where: { id: externalId } });
  if (!payment) {
    console.warn(`[payments/callback] Payment not found: ${externalId}`);
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // 3. Idempotency – already processed
  if (payment.status === "completed") {
    return NextResponse.json({ ok: true, note: "Already processed" });
  }

  if (transactionStatus !== "success" && transactionStatus !== "successful") {
    // Mark as failed, do not activate subscription
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.json({ ok: true, note: "Payment not successful" });
  }

  // 4. Mark payment completed
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "completed",
      confirmedAt: new Date(),
      providerRef,
    },
  });

  // 5. Activate / extend subscription
  const subscription = await prisma.subscription.findUnique({
    where: { id: payment.subscriptionId },
    include: { plan: true },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  // Calculate new period: 1 calendar month from now (or from current period end if not yet expired)
  const base =
    subscription.currentPeriodEnd > new Date()
      ? subscription.currentPeriodEnd
      : new Date();
  const nextEnd = new Date(base);
  nextEnd.setMonth(nextEnd.getMonth() + 1);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: nextEnd,
      gracePeriodEndsAt: null,
      cancelledAt: null,
    },
  });

  // 6. Send confirmation email (fire-and-forget)
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: payment.restaurantId },
      include: { users: { where: { role: "owner" }, select: { email: true }, take: 1 } },
    });
    const ownerEmail = restaurant?.users[0]?.email;
    if (ownerEmail && restaurant) {
      const billingPeriod = new Date().toLocaleDateString("en-TZ", {
        month: "long",
        year: "numeric",
      });
      await sendPaymentConfirmed(ownerEmail, payment.amountTZS, billingPeriod);
    }
  } catch (emailErr) {
    console.error("[payments/callback] email error:", emailErr);
  }

  return NextResponse.json({ ok: true });
}
