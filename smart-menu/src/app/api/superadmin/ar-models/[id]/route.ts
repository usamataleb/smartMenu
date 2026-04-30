import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Record<string, unknown> = {};
  if (typeof body.isPublished === "boolean") data.isPublished = body.isPublished;
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.tags === "string") data.tags = body.tags.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const model = await prisma.aRModel.update({ where: { id }, data }).catch(() => null);
  if (!model) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, model });
}
