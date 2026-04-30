import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin");

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      restaurant: { select: { name: true, slug: true } },
      subscription: { include: { plan: { select: { displayName: true } } } },
    },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">💳</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin</p>
            <p className="text-sm font-bold">Payments Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-50 flex items-center justify-between">
            <h2 className="font-bold text-stone-800">Recent Payments</h2>
            <span className="text-xs text-stone-400">Showing last 100</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-3 py-3">Restaurant</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Amount</th>
                  <th className="text-left px-3 py-3">Provider</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Ref</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => {
                  return (
                    <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3 text-stone-500 whitespace-nowrap">
                        {p.createdAt.toLocaleString("en-TZ", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-stone-800">{p.restaurant.name}</p>
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        {p.subscription.plan.displayName}
                      </td>
                      <td className="px-3 py-3 font-medium">TZS {p.amountTZS.toLocaleString()}</td>
                      <td className="px-3 py-3 text-stone-500 capitalize">{p.provider}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          p.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                          p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-stone-400 font-mono">
                        {p.providerRef ?? "—"}
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
