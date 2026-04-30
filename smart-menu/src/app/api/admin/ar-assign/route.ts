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
  const { menuItemId, modelId } = body as { menuItemId?: string; modelId?: string };

  if (!menuItemId || !modelId) {
    return NextResponse.json({ error: "menuItemId and modelId are required" }, { status: 400 });
  }

  const [item, model] = await Promise.all([
    prisma.menuItem.findFirst({ where: { id: menuItemId, restaurantId } }),
    prisma.aRModel.findUnique({ where: { id: modelId, isPublished: true } }),
  ]);

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.aRAssignment.create({ data: { modelId, menuItemId } }),
    prisma.menuItem.update({
      where: { id: menuItemId },
      data: { glbUrl: model.filePath, arStatus: "assigned" },
    }),
  ]);

  return NextResponse.json({ ok: true, glbUrl: model.filePath }, { status: 201 });
}
