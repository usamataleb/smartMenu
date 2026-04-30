"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireSuperadmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin/login");
}

const ItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  category: z.string().min(1, "Category is required").max(60),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  glbUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  available: z.coerce.boolean().optional(),
});

export async function saCreateMenuItem(
  restaurantId: string,
  prevState: { error?: string } | null,
  formData: FormData
) {
  await requireSuperadmin();

  const parsed = ItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl"),
    glbUrl: formData.get("glbUrl"),
    available: formData.get("available") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { imageUrl, glbUrl, description, ...rest } = parsed.data;

  await prisma.menuItem.create({
    data: {
      ...rest,
      description: description || null,
      imageUrl: imageUrl || null,
      glbUrl: glbUrl || null,
      restaurantId,
    },
  });

  revalidatePath(`/superadmin/restaurants/${restaurantId}/menu`);
  redirect(`/superadmin/restaurants/${restaurantId}/menu`);
}

export async function saUpdateMenuItem(
  restaurantId: string,
  itemId: string,
  prevState: { error?: string } | null,
  formData: FormData
) {
  await requireSuperadmin();

  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) return { error: "Item not found" };

  const parsed = ItemSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    category: formData.get("category"),
    imageUrl: formData.get("imageUrl"),
    glbUrl: formData.get("glbUrl"),
    available: formData.get("available") === "on",
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { imageUrl, glbUrl, description, ...rest } = parsed.data;

  await prisma.menuItem.update({
    where: { id: itemId },
    data: {
      ...rest,
      description: description || null,
      imageUrl: imageUrl || null,
      glbUrl: glbUrl || null,
    },
  });

  revalidatePath(`/superadmin/restaurants/${restaurantId}/menu`);
  redirect(`/superadmin/restaurants/${restaurantId}/menu`);
}

export async function saDeleteMenuItem(restaurantId: string, itemId: string) {
  await requireSuperadmin();
  await prisma.menuItem.deleteMany({ where: { id: itemId, restaurantId } });
  revalidatePath(`/superadmin/restaurants/${restaurantId}/menu`);
}

export async function saToggleAvailability(restaurantId: string, itemId: string, available: boolean) {
  await requireSuperadmin();
  await prisma.menuItem.updateMany({
    where: { id: itemId, restaurantId },
    data: { available },
  });
  revalidatePath(`/superadmin/restaurants/${restaurantId}/menu`);
}
