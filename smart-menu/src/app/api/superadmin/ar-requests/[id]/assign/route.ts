import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReactivated } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { modelId } = body as { modelId?: string };

  if (!modelId) return NextResponse.json({ error: "modelId is required" }, { status: 400 });

  const [arRequest, model] = await Promise.all([
    prisma.aRRequest.findUnique({ where: { id }, include: { menuItem: true } }),
    prisma.aRModel.findUnique({ where: { id: modelId } }),
  ]);

  if (!arRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  if (!model) return NextResponse.json({ error: "Model not found" }, { status: 404 });

  // Create assignment, update MenuItem glbUrl + arStatus, mark request done
  await prisma.$transaction([
    prisma.aRAssignment.create({ data: { modelId, menuItemId: arRequest.menuItemId } }),
    prisma.menuItem.update({
      where: { id: arRequest.menuItemId },
      data: { glbUrl: model.filePath, arStatus: "assigned" },
    }),
    prisma.aRRequest.update({ where: { id }, data: { status: "done" } }),
  ]);

  // Notify restaurant owner (fire-and-forget)
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: arRequest.restaurantId },
      include: { users: { where: { role: "owner" }, select: { email: true }, take: 1 } },
    });
    const ownerEmail = restaurant?.users[0]?.email;
    if (ownerEmail && restaurant) {
      await sendReactivated(ownerEmail, `Your 3D model for "${arRequest.menuItem.name}" is ready!`);
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
