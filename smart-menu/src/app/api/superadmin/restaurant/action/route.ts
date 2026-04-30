import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string };
  if (user?.role !== "superadmin" || !user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { restaurantId, action, reason } = await req.json();
  if (!restaurantId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { restaurantId }
  });

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  let updateData: any = {};
  
  switch (action) {
    case "suspend":
      updateData = { status: "suspended" };
      break;
    case "reactivate":
      updateData = { status: "active" };
      break;
    case "extend_trial":
      const extDate = sub.trialEndsAt ? new Date(sub.trialEndsAt.getTime() + 7 * 86400000) : new Date(Date.now() + 7 * 86400000);
      updateData = { status: "trial", trialEndsAt: extDate };
      break;
    case "waive_payment":
      updateData = { status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 86400000) };
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { restaurantId },
      data: updateData,
    }),
    prisma.adminAction.create({
      data: {
        restaurantId,
        adminId: user.id,
        action,
        details: JSON.stringify({ reason }),
      }
    })
  ]);

  return NextResponse.json({ ok: true });
}
