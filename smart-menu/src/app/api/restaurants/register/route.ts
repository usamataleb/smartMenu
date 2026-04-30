import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug } from "@/lib/slug";

const Schema = z.object({
  restaurantName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(20),
  password: z.string().min(6),
  address: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { restaurantName, email, phone, password, address } = parsed.data;

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const slug = await ensureUniqueSlug(restaurantName);
  const passwordHash = await bcrypt.hash(password, 10);

  // Get starter plan
  const starterPlan = await prisma.plan.findUnique({ where: { name: "starter" } });
  if (!starterPlan) {
    return NextResponse.json({ error: "Service not configured. Please try again later." }, { status: 500 });
  }

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: restaurantName,
      slug,
      address: address || null,
      phone,
      users: {
        create: { email, passwordHash, role: "owner" },
      },
      subscription: {
        create: {
          planId: starterPlan.id,
          status: "trial",
          trialEndsAt: trialEnd,
          currentPeriodEnd: trialEnd,
        },
      },
    },
  });

  return NextResponse.json({ slug: restaurant.slug, restaurantId: restaurant.id }, { status: 201 });
}
