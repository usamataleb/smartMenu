"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canAddItem } from "@/lib/subscription";

const ItemSchema = z.object({
  name:          z.string().min(1, "Name is required").max(100),
  description:   z.string().max(500).optional(),
  price:         z.coerce.number().min(0, "Price must be 0 or more"),
  category:      z.string().min(1, "Category is required").max(60),
  imageUrl:      z.string().url("Must be a valid URL").optional().or(z.literal("")),
  glbUrl:        z.string().url("Must be a valid URL").optional().or(z.literal("")),
  available:     z.coerce.boolean().optional(),
  tags:          z.string().max(200).optional(),
  availableFrom: z.string().max(5).optional(),
  availableTo:   z.string().max(5).optional(),
  availableDays: z.enum(["everyday", "weekdays", "weekends"]).optional(),
});

async function requireRestaurantId() {
  const session = await getServerSession(authOptions);
  const role         = (session?.user as { role?: string })?.role;
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId || (role !== "owner" && role !== "superadmin")) redirect("/admin/login");
  return restaurantId;
}

export async function createMenuItem(prevState: { error?: string } | null, formData: FormData) {
  const restaurantId = await requireRestaurantId();

  const limit = await canAddItem(restaurantId);
  if (!limit.allowed) return { error: limit.reason ?? "Cannot add item" };

  const parsed = ItemSchema.safeParse({
    name:          formData.get("name"),
    description:   formData.get("description"),
    price:         formData.get("price"),
    category:      formData.get("category"),
    imageUrl:      formData.get("imageUrl"),
    glbUrl:        formData.get("glbUrl"),
    available:     formData.get("available") === "on",
    tags:          formData.get("tags"),
    availableFrom: formData.get("availableFrom") || undefined,
    availableTo:   formData.get("availableTo") || undefined,
    availableDays: formData.get("availableDays") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { imageUrl, glbUrl, description, tags, availableFrom, availableTo, availableDays, ...rest } = parsed.data;

  await prisma.menuItem.create({
    data: {
      ...rest,
      description:   description || null,
      imageUrl:      imageUrl || null,
      glbUrl:        glbUrl || null,
      tags:          tags ?? "",
      availableFrom: availableFrom || null,
      availableTo:   availableTo || null,
      availableDays: availableDays ?? "everyday",
      restaurantId,
    },
  });

  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

export async function updateMenuItem(id: string, prevState: { error?: string } | null, formData: FormData) {
  const restaurantId = await requireRestaurantId();

  const item = await prisma.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) return { error: "Item not found" };

  const parsed = ItemSchema.safeParse({
    name:          formData.get("name"),
    description:   formData.get("description"),
    price:         formData.get("price"),
    category:      formData.get("category"),
    imageUrl:      formData.get("imageUrl"),
    glbUrl:        formData.get("glbUrl"),
    available:     formData.get("available") === "on",
    tags:          formData.get("tags"),
    availableFrom: formData.get("availableFrom") || undefined,
    availableTo:   formData.get("availableTo") || undefined,
    availableDays: formData.get("availableDays") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { imageUrl, glbUrl, description, tags, availableFrom, availableTo, availableDays, ...rest } = parsed.data;

  await prisma.menuItem.update({
    where: { id },
    data: {
      ...rest,
      description:   description || null,
      imageUrl:      imageUrl || null,
      glbUrl:        glbUrl || null,
      tags:          tags ?? "",
      availableFrom: availableFrom || null,
      availableTo:   availableTo || null,
      availableDays: availableDays ?? "everyday",
    },
  });

  revalidatePath("/admin/menu");
  redirect("/admin/menu");
}

export async function deleteMenuItem(id: string) {
  const restaurantId = await requireRestaurantId();
  await prisma.menuItem.deleteMany({ where: { id, restaurantId } });
  revalidatePath("/admin/menu");
}

export async function toggleAvailability(id: string, available: boolean) {
  const restaurantId = await requireRestaurantId();
  await prisma.menuItem.updateMany({
    where: { id, restaurantId },
    data: { available },
  });
  revalidatePath("/admin/menu");
}
