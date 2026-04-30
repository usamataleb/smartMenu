"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function getRestaurantId() {
  const session = await getServerSession(authOptions);
  const role         = (session?.user as { role?: string })?.role;
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId || (role !== "owner" && role !== "superadmin")) redirect("/admin/login");
  return restaurantId;
}

const ProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().max(200).optional(),
  phone: z.string().min(9).max(20).optional(),
});

export async function updateOnboardingProfile(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const restaurantId = await getRestaurantId();

  const parsed = ProfileSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: parsed.data,
  });

  return { ok: true };
}

const FirstItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.string().min(1, "Category is required").max(60),
});

export async function createFirstMenuItem(
  prevState: { error?: string } | null,
  formData: FormData
) {
  const restaurantId = await getRestaurantId();

  const parsed = FirstItemSchema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    category: formData.get("category"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.menuItem.create({
    data: {
      ...parsed.data,
      available: true,
      restaurantId,
    },
  });

  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function completeOnboarding() {
  const restaurantId = await getRestaurantId();
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { onboardingComplete: true },
  });
  revalidatePath("/admin");
  redirect("/admin");
}
