"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireRestaurantId() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId || (role !== "owner" && role !== "superadmin")) redirect("/admin/login");
  return restaurantId;
}

async function requireTableQRPlan(restaurantId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { restaurantId },
    include: { plan: true },
  });

  if (!subscription?.plan.hasTableQR) {
    throw new Error("Table QR codes require the Business plan.");
  }
}

export async function createTable(formData: FormData) {
  const restaurantId = await requireRestaurantId();
  await requireTableQRPlan(restaurantId);

  const number = Number(formData.get("number"));
  const label = String(formData.get("label") ?? "").trim();

  if (!Number.isInteger(number) || number < 1 || number > 999) {
    throw new Error("Table number must be between 1 and 999.");
  }

  await prisma.table.upsert({
    where: { restaurantId_number: { restaurantId, number } },
    update: { label: label || null },
    create: { restaurantId, number, label: label || null },
  });

  revalidatePath("/admin/tables");
}

export async function deleteTable(id: string) {
  const restaurantId = await requireRestaurantId();
  await requireTableQRPlan(restaurantId);

  await prisma.table.deleteMany({ where: { id, restaurantId } });
  revalidatePath("/admin/tables");
}
