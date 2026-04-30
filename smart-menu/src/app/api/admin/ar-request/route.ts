import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canAR = await hasFeature(restaurantId, "hasAR");
  if (!canAR) return NextResponse.json({ error: "AR is not available on your plan" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { menuItemId, description } = body as { menuItemId?: string; description?: string };

  if (!menuItemId) return NextResponse.json({ error: "menuItemId is required" }, { status: 400 });

  const item = await prisma.menuItem.findFirst({ where: { id: menuItemId, restaurantId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (item.arStatus === "assigned") {
    return NextResponse.json({ error: "This item already has an AR model" }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.aRRequest.create({ data: { menuItemId, restaurantId, description: description ?? null } }),
    prisma.menuItem.update({ where: { id: menuItemId }, data: { arStatus: "pending" } }),
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
