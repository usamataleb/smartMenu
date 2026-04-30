import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId || (role !== "owner" && role !== "superadmin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.menuItem.updateMany({
        where: { id, restaurantId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
