import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription";
import Link from "next/link";
import ARRequestClient from "./ARRequestClient";

export const dynamic = "force-dynamic";

export default async function ARRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const canAR = await hasFeature(restaurantId, "hasAR");
  if (!canAR) redirect("/admin/billing");

  const { id } = await params;
  const item = await prisma.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) notFound();

  if (item.arStatus === "assigned") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-stone-900">{item.name} already has AR</h1>
        <p className="text-stone-500 text-sm">This dish already has a 3D model assigned. Customers can view it in AR on your menu.</p>
        <Link href="/admin/menu" className="inline-block text-amber-500 hover:text-amber-600 font-medium text-sm">
          ← Back to menu
        </Link>
      </div>
    );
  }

  // Fetch published library models
  const libraryModels = await prisma.aRModel.findMany({
    where: { isPublished: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, tags: true, filePath: true },
  });

  return (
    <ARRequestClient
      item={{ id: item.id, name: item.name, arStatus: item.arStatus }}
      libraryModels={libraryModels}
    />
  );
}
