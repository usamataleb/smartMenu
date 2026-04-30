import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ItemForm } from "../../ItemForm";
import { saUpdateMenuItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SAEditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin/login");

  const { id: restaurantId, itemId } = await params;

  const [restaurant, item] = await Promise.all([
    prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { id: true, name: true } }),
    prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } }),
  ]);

  if (!restaurant || !item) notFound();

  const action = saUpdateMenuItem.bind(null, restaurantId, itemId);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">✏️</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin / {restaurant.name} / Edit Item</p>
            <p className="text-sm font-bold">{item.name}</p>
          </div>
        </div>
        <Link
          href={`/superadmin/restaurants/${restaurantId}/menu`}
          className="text-xs text-stone-400 hover:text-white transition-colors"
        >
          ← Back to menu
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <h1 className="text-lg font-bold text-stone-900 mb-6">Edit item</h1>
          <ItemForm
            action={action}
            defaultValues={{
              name: item.name,
              description: item.description ?? "",
              price: item.price,
              category: item.category,
              imageUrl: item.imageUrl ?? "",
              glbUrl: item.glbUrl ?? "",
              available: item.available,
            }}
            cancelHref={`/superadmin/restaurants/${restaurantId}/menu`}
            submitLabel="Save changes"
          />
        </div>
      </div>
    </div>
  );
}
