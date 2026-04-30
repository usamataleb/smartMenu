import { prisma } from "@/lib/prisma";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  const slug = slugify(base);
  const existing = await prisma.restaurant.findUnique({ where: { slug } });
  if (!existing) return slug;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${slug}-${i}`;
    const taken = await prisma.restaurant.findUnique({ where: { slug: candidate } });
    if (!taken) return candidate;
  }
  return `${slug}-${Date.now()}`;
}
