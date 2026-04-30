import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadModel } from "@/lib/blob";

const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string | null)?.trim();
  const tags = (formData.get("tags") as string | null)?.trim() ?? "";

  if (!file || !name) {
    return NextResponse.json({ error: "file and name are required" }, { status: 400 });
  }
  if (!file.name.endsWith(".glb")) {
    return NextResponse.json({ error: "Only .glb files are accepted" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be under 8 MB" }, { status: 400 });
  }

  const model = await prisma.aRModel.create({
    data: { name, tags, filePath: "", sizeBytes: file.size },
  });

  try {
    const url = await uploadModel(file, model.id);
    await prisma.aRModel.update({ where: { id: model.id }, data: { filePath: url } });
    return NextResponse.json({ id: model.id, filePath: url }, { status: 201 });
  } catch (err) {
    await prisma.aRModel.delete({ where: { id: model.id } });
    console.error("[ar-models] upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 502 });
  }
}
