import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { SortableMenu } from "./SortableMenu";
import { deleteMenuItem, toggleAvailability } from "./actions";

export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const [items, sub] = await Promise.all([
    prisma.menuItem.findMany({
      where: { restaurantId },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.subscription.findUnique({
      where: { restaurantId },
      include: { plan: true },
    }),
  ]);

  const plan     = sub?.plan;
  const atLimit  = plan && plan.maxItems > 0 && items.length >= plan.maxItems;
  const nearLimit = plan && plan.maxItems > 0 && items.length >= plan.maxItems * 0.8 && !atLimit;
  const hasAR    = plan?.hasAR ?? false;

  async function handleToggle(id: string, available: boolean) {
    "use server";
    await toggleAvailability(id, available);
  }

  async function handleDelete(id: string) {
    "use server";
    await deleteMenuItem(id);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-stone-900">My Menu</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {items.length} item{items.length !== 1 ? "s" : ""}
            {plan && plan.maxItems > 0 ? ` / ${plan.maxItems} max` : ""}
            {" · "}
            <span className="text-stone-400">drag rows to reorder</span>
          </p>
        </div>
        {atLimit ? (
          <Link href="/admin/billing" className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
            Upgrade to add more
          </Link>
        ) : (
          <Link href="/admin/menu/new" className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
            <span className="text-base leading-none">+</span> Add item
          </Link>
        )}
      </div>

      {/* Limit banners */}
      {nearLimit && plan && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800">
            <strong>Almost at your limit</strong> — {items.length} of {plan.maxItems} items used.
          </p>
          <Link href="/admin/billing" className="shrink-0 text-xs font-bold text-amber-700 hover:text-amber-900">Upgrade →</Link>
        </div>
      )}
      {atLimit && plan && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-red-800">
            <strong>Item limit reached</strong> — {plan.maxItems} items on the {plan.displayName} plan.
          </p>
          <Link href="/admin/billing" className="shrink-0 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-colors">Upgrade now →</Link>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="font-medium mb-4">No menu items yet</p>
          <Link href="/admin/menu/new" className="text-amber-500 hover:text-amber-600 font-medium text-sm">
            Add your first dish →
          </Link>
        </div>
      )}

      {/* Sortable list */}
      {items.length > 0 && (
        <SortableMenu
          initialItems={items}
          hasAR={hasAR}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}

      {/* AR upsell */}
      {!hasAR && items.length > 0 && (
        <div className="mt-6 bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-violet-900">Unlock 3D AR previews</p>
            <p className="text-xs text-violet-700 mt-0.5">Let customers see your dishes in 3D. Available on Professional & Business plans.</p>
          </div>
          <Link href="/admin/billing" className="shrink-0 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors">Upgrade →</Link>
        </div>
      )}
    </div>
  );
}
