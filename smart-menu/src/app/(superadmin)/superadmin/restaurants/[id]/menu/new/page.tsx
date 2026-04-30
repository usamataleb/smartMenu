import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ItemForm } from "../ItemForm";
import { saCreateMenuItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function SANewMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin/login");

  const { id: restaurantId } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true },
  });

  if (!restaurant) notFound();

  const action = saCreateMenuItem.bind(null, restaurantId);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">➕</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin / {restaurant.name} / New Item</p>
            <p className="text-sm font-bold">Add Menu Item</p>
          </div>
        </div>
        <Link
          href={`/superadmin/restaurants/${restaurantId}/menu`}
          className="text-xs text-stone-400 hover:text-white transition-colors"
        >
          ← Cancel
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h1 className="text-lg font-bold text-stone-900 mb-6">New menu item</h1>
          <ItemForm
            action={action}
            cancelHref={`/superadmin/restaurants/${restaurantId}/menu`}
            submitLabel="Add item"
          />
        </div>
      </div>
    </div>
  );
}
