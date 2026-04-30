import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID = ["pending", "in_progress", "done", "rejected"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, note } = body as { status?: string; note?: string };

  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID.join(", ")}` }, { status: 400 });
  }

  const updated = await prisma.aRRequest.update({
    where: { id },
    data: { status, ...(note !== undefined ? { note } : {}) },
  }).catch(() => null);

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
