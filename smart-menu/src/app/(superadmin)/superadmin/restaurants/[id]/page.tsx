import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RestaurantActions } from "./RestaurantActions";

export const dynamic = "force-dynamic";

export default async function RestaurantManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin");

  const { id } = await params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      users: { select: { email: true, role: true } },
      adminActions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { admin: { select: { email: true } } }
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      }
    }
  });

  if (!restaurant) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🛠️</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin / Restaurant</p>
            <p className="text-sm font-bold">{restaurant.name}</p>
          </div>
        </div>
        <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">{restaurant.name}</h1>
              <p className="text-stone-500 font-mono text-sm">{restaurant.slug}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                restaurant.subscription?.status === 'active' ? 'bg-green-100 text-green-700' :
                restaurant.subscription?.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {restaurant.subscription?.status}
              </span>
              <p className="text-sm text-stone-600">
                Plan: <strong className="text-stone-900">{restaurant.subscription?.plan.displayName}</strong>
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100 flex flex-wrap gap-3">
            <Link
              href={`/superadmin/restaurants/${restaurant.id}/menu`}
              className="bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              📋 Manage Menu
            </Link>
            <a
              href={`/menu/${restaurant.slug}`}
              target="_blank"
              className="border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
            >
              ↗ View live menu
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-800 uppercase tracking-wider mb-4">Manual Overrides</h3>
            <RestaurantActions
              restaurantId={restaurant.id}
              currentStatus={restaurant.subscription?.status ?? "none"}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Audit Log */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <h3 className="font-bold text-stone-800 mb-4">Admin Audit Log</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {restaurant.adminActions.length === 0 ? (
                <p className="text-sm text-stone-400">No actions recorded.</p>
              ) : (
                restaurant.adminActions.map(action => (
                  <div key={action.id} className="text-sm border-l-2 border-stone-200 pl-3">
                    <p className="font-medium text-stone-900">{action.action.replace('_', ' ')}</p>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">{action.details}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      By {action.admin.email} on {action.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment History snippet */}
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            <h3 className="font-bold text-stone-800 mb-4">Recent Payments</h3>
            <div className="space-y-3">
              {restaurant.payments.length === 0 ? (
                <p className="text-sm text-stone-400">No payments yet.</p>
              ) : (
                restaurant.payments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between text-sm py-2 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="font-medium text-stone-800">TZS {payment.amountTZS.toLocaleString()}</p>
                      <p className="text-xs text-stone-400">{payment.createdAt.toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      payment.status === 'completed' ? 'bg-green-50 text-green-700' : 
                      payment.status === 'pending' ? 'bg-amber-50 text-amber-700' : 
                      'bg-red-50 text-red-700'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
