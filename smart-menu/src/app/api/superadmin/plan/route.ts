import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string };
  if (user?.role !== "superadmin" || !user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { restaurantId, planId } = await req.json();
  if (!restaurantId || !planId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const oldSub = await prisma.subscription.findUnique({
    where: { restaurantId },
    select: { planId: true }
  });

  await prisma.$transaction([
    prisma.subscription.update({
      where: { restaurantId },
      data: { planId },
    }),
    prisma.adminAction.create({
      data: {
        restaurantId,
        adminId: user.id,
        action: "plan_change",
        details: JSON.stringify({ from: oldSub?.planId, to: planId }),
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
