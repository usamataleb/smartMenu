import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MenuClient from "./MenuClient";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const tableNumber = Number((await searchParams)?.table);

  let restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      },
      subscription: { include: { plan: true } },
    },
  });

  // If not found by restaurant slug, check if it's a branch slug
  if (!restaurant) {
    const branch = await prisma.branch.findUnique({
      where: { slug },
      include: {
        restaurant: {
          include: {
            menuItems: {
              where: { available: true },
              orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
            },
            subscription: { include: { plan: true } },
          }
        }
      }
    });

    if (branch?.restaurant) {
      // Use the restaurant's menu, but we could override the name/address here if needed
      restaurant = {
        ...branch.restaurant,
        name: `${branch.restaurant.name} (${branch.name})`,
        address: branch.address || branch.restaurant.address,
      };
    }
  }

  if (!restaurant) notFound();

  // Non-blocking view tracking
  prisma.menuPageView.create({
    data: {
      restaurantId: restaurant.id,
      source: "direct", // we could infer 'qr' if they have a query param
    },
  }).catch(() => {});

  if (restaurant.subscription?.status === "suspended") {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">{restaurant.name}</h1>
          <p className="text-stone-400 text-sm">
            This menu is temporarily unavailable. Please contact the restaurant directly.
          </p>
        </div>
      </div>
    );
  }

  const table = Number.isInteger(tableNumber) && tableNumber > 0
    ? await prisma.table.findFirst({
        where: { restaurantId: restaurant.id, number: tableNumber },
        select: { number: true, label: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Hero header */}
      <header className="bg-gradient-to-b from-stone-900 to-stone-800 text-white">
        <div className="max-w-2xl mx-auto px-5 pt-10 pb-8">
          <div className="inline-block bg-amber-500 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 tracking-wide uppercase">
            {table ? `Table ${table.number}` : "Menu"}
          </div>
          <h1 className="text-3xl font-bold leading-tight">{restaurant.name}</h1>
          {table?.label && (
            <p className="text-amber-200 text-sm mt-1.5">{table.label}</p>
          )}
          {restaurant.address && (
            <p className="text-stone-400 text-sm mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {restaurant.address}
            </p>
          )}
          <p className="text-stone-500 text-xs mt-3">
            {restaurant.menuItems.length} items available
          </p>
        </div>
      </header>

      <MenuClient
        items={restaurant.menuItems}
        hasAR={restaurant.subscription?.plan?.hasAR ?? false}
      />
    </div>
  );
}
