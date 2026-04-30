import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PlanChanger } from "./PlanChanger";

export const dynamic = "force-dynamic";

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (role !== "superadmin") redirect("/admin");

  const [restaurants, plans] = await Promise.all([
    prisma.restaurant.findMany({
      include: {
        subscription: { include: { plan: true } },
        users: { where: { role: "owner" }, select: { email: true } },
        _count: { select: { menuItems: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } }),
  ]);

  const stats = {
    total: restaurants.length,
    active: restaurants.filter((r) => r.subscription?.status === "active").length,
    trial: restaurants.filter((r) => r.subscription?.status === "trial").length,
    suspended: restaurants.filter((r) => r.subscription?.status === "suspended").length,
    mrr: restaurants
      .filter((r) => r.subscription?.status === "active")
      .reduce((sum, r) => sum + (r.subscription?.plan.priceMonthly ?? 0), 0),
  };

  const STATUS_STYLE: Record<string, string> = {
    trial: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-green-50 text-green-700 border-green-200",
    grace: "bg-orange-50 text-orange-700 border-orange-200",
    suspended: "bg-red-50 text-red-700 border-red-200",
    cancelled: "bg-stone-100 text-stone-500 border-stone-200",
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-stone-800">
            <span className="text-xl">🍽️</span>
            <div>
              <p className="text-xs text-stone-400">Smart Menu</p>
              <p className="text-sm font-bold">Super Admin</p>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <a href="/superadmin" className="font-semibold text-white">Restaurants</a>
            <a href="/superadmin/plans" className="text-stone-400 hover:text-white transition-colors">Plans</a>
            <a href="/superadmin/payments" className="text-stone-400 hover:text-white transition-colors">Payments</a>
          </nav>
        </div>
        <span className="text-xs text-stone-400">{session?.user?.email}</span>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: "Total", value: stats.total, color: "text-stone-800" },
            { label: "Trial", value: stats.trial, color: "text-amber-600" },
            { label: "Active", value: stats.active, color: "text-green-600" },
            { label: "Suspended", value: stats.suspended, color: "text-red-500" },
            { label: "MRR (TZS)", value: stats.mrr.toLocaleString(), color: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <p className="text-xs text-stone-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Restaurant table */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
            <h2 className="font-bold text-stone-800">All Restaurants</h2>
            <span className="text-xs text-stone-400">{restaurants.length} total</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Restaurant</th>
                  <th className="text-left px-3 py-3">Owner</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Items</th>
                  <th className="text-left px-3 py-3">Trial ends</th>
                  <th className="text-left px-3 py-3">Change plan</th>
                  <th className="text-left px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => {
                  const sub = r.subscription;
                  const status = sub?.status ?? "none";
                  const trialDays = sub?.trialEndsAt
                    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))
                    : null;

                  return (
                    <tr key={r.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-stone-800">{r.name}</p>
                        <p className="text-xs text-stone-400 font-mono">{r.slug}</p>
                      </td>
                      <td className="px-3 py-3 text-stone-500 text-xs">{r.users[0]?.email ?? "—"}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-stone-600 capitalize">
                          {sub?.plan.displayName ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLE[status] ?? STATUS_STYLE.cancelled}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-500">{r._count.menuItems}</td>
                      <td className="px-3 py-3 text-stone-400 text-xs">
                        {trialDays !== null ? `${trialDays}d left` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <PlanChanger
                          restaurantId={r.id}
                          currentPlanId={sub?.planId ?? ""}
                          plans={plans.map((p) => ({ id: p.id, displayName: p.displayName }))}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <a 
                          href={`/superadmin/restaurants/${r.id}`}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors inline-block"
                        >
                          Manage
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
