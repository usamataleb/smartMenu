import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminPlansPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin");

  const plans = await prisma.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: {
      _count: { select: { subscriptions: true } }
    }
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin</p>
            <p className="text-sm font-bold">Plans & Tiers</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">{plan.displayName}</h3>
                  <p className="text-xs text-stone-400 font-mono">{plan.name}</p>
                </div>
                <span className="bg-stone-50 text-stone-600 text-xs font-bold px-2 py-1 rounded-lg">
                  {plan._count.subscriptions} subs
                </span>
              </div>
              
              <div className="mb-6 space-y-1">
                <p className="text-2xl font-bold text-stone-800">
                  {plan.priceMonthly === 0 ? "Free" : `TZS ${plan.priceMonthly.toLocaleString()}`}
                  <span className="text-sm font-normal text-stone-400">/mo</span>
                </p>
                {plan.priceAnnual > 0 && (
                  <p className="text-xs text-stone-400">TZS {plan.priceAnnual.toLocaleString()}/yr</p>
                )}
              </div>

              <div className="space-y-3 text-sm text-stone-600 flex-1">
                <div className="flex justify-between border-b border-stone-50 pb-2">
                  <span>Max Items</span>
                  <span className="font-medium text-stone-900">{plan.maxItems === -1 ? "Unlimited" : plan.maxItems}</span>
                </div>
                <div className="flex justify-between border-b border-stone-50 pb-2">
                  <span>Max Branches</span>
                  <span className="font-medium text-stone-900">{plan.maxBranches === -1 ? "Unlimited" : plan.maxBranches}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>AR Models</span>
                  <span>{plan.hasAR ? "✅" : "❌"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Image Uploads</span>
                  <span>{plan.hasImageUpload ? "✅" : "❌"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Analytics</span>
                  <span>{plan.hasAnalytics ? "✅" : "❌"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Custom Branding</span>
                  <span>{plan.hasCustomBranding ? "✅" : "❌"}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>Table QR Linking</span>
                  <span>{plan.hasTableQR ? "✅" : "❌"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
