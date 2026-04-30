import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { saDeleteMenuItem, saToggleAvailability } from "./actions";

export const dynamic = "force-dynamic";

export default async function SARestaurantMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin/login");

  const { id: restaurantId } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      menuItems: {
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!restaurant) notFound();

  const categories = [...new Set(restaurant.menuItems.map((i) => i.category))].sort();

  async function deleteItem(itemId: string) {
    "use server";
    await saDeleteMenuItem(restaurantId, itemId);
  }

  async function toggleItem(itemId: string, available: boolean) {
    "use server";
    await saToggleAvailability(restaurantId, itemId, available);
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin / Restaurant / Menu</p>
            <p className="text-sm font-bold">{restaurant.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/restaurants/${restaurantId}`}
            className="text-xs text-stone-400 hover:text-white transition-colors"
          >
            ← Restaurant
          </Link>
          <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Menu Items</h1>
            <p className="text-sm text-stone-500 mt-0.5">{restaurant.menuItems.length} items across {categories.length} categories</p>
          </div>
          <Link
            href={`/superadmin/restaurants/${restaurantId}/menu/new`}
            className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            + Add item
          </Link>
        </div>

        {restaurant.menuItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center">
            <p className="text-stone-400 text-sm">No menu items yet.</p>
            <Link
              href={`/superadmin/restaurants/${restaurantId}/menu/new`}
              className="mt-4 inline-block bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              Add first item
            </Link>
          </div>
        ) : (
          categories.map((cat) => {
            const items = restaurant.menuItems.filter((i) => i.category === cat);
            return (
              <div key={cat} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-100 px-5 py-3">
                  <h2 className="text-xs font-bold text-stone-500 uppercase tracking-widest">{cat}</h2>
                </div>
                <div className="divide-y divide-stone-50">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      {item.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-300 text-sm">
                          📷
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-stone-900 text-sm truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-stone-400 truncate">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-stone-700">
                          TZS {item.price.toLocaleString()}
                        </span>

                        {item.glbUrl && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
                            3D
                          </span>
                        )}

                        <form action={toggleItem.bind(null, item.id, !item.available)}>
                          <button
                            type="submit"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                              item.available
                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                : "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200"
                            }`}
                          >
                            {item.available ? "Available" : "Hidden"}
                          </button>
                        </form>

                        <Link
                          href={`/superadmin/restaurants/${restaurantId}/menu/${item.id}/edit`}
                          className="text-xs text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Edit
                        </Link>

                        <form action={deleteItem.bind(null, item.id)}>
                          <button
                            type="submit"
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            onClick={(e) => {
                              if (!confirm(`Delete "${item.name}"?`)) e.preventDefault();
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
