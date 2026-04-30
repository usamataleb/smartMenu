import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription";
import { z } from "zod";
import { ensureUniqueSlug } from "@/lib/slug";

const BranchSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  
  if (!restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gate check
  const canMultiBranch = await hasFeature(restaurantId, "hasMultiBranch");
  if (!canMultiBranch) {
    return NextResponse.json({ error: "Upgrade to the Business plan to create multiple branches." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = BranchSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, address } = parsed.data;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Branch slug format: restaurant-slug-branch-name
    const slug = await ensureUniqueSlug(`${restaurant.slug}-${name}`);

    const branch = await prisma.branch.create({
      data: {
        restaurantId,
        name,
        slug,
        address,
      }
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error) {
    console.error("[branches] Error creating branch:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
