import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId as string | undefined;
    if (!itemId) return NextResponse.json({ ok: false }, { status: 400 });

    // Non-blocking write — don't wait for it
    prisma.menuItemView.create({ data: { itemId } }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
