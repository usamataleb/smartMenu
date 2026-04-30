import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLAN_FEATURES: Record<string, string[]> = {
  starter: [
    "Up to 10 menu items",
    "QR code for your menu",
    "Mobile-friendly menu page",
    "1 restaurant location",
  ],
  professional: [
    "Unlimited menu items",
    "QR code for your menu",
    "3D AR food preview",
    "Image upload",
    "Analytics & scan counts",
    "1 restaurant location",
  ],
  business: [
    "Unlimited menu items",
    "QR code per branch",
    "3D AR food preview",
    "Image upload",
    "Analytics & scan counts",
    "Up to 5 branches",
    "WhatsApp notifications",
    "Custom branding",
  ],
};

const STATUS_STYLE: Record<string, string> = {
  trial: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-green-50 text-green-700 border-green-200",
  grace: "bg-orange-50 text-orange-700 border-orange-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: { subscription: { include: { plan: true } } },
  });
  if (!restaurant) redirect("/admin/login");

  const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } });

  const payments = await prisma.payment.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const sub = restaurant.subscription;
  const currentPlan = sub?.plan;
  const statusStyle = STATUS_STYLE[sub?.status ?? ""] ?? STATUS_STYLE.trial;

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Billing & Subscription</h1>
        <p className="text-stone-500 text-sm mt-1">Manage your plan and payment method.</p>
      </div>

      {/* Current plan */}
      <div className={`rounded-2xl border p-5 ${statusStyle}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Current plan</p>
            <p className="text-xl font-bold">{currentPlan?.displayName ?? "Free"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border capitalize ${statusStyle}`}>
                {sub?.status ?? "trial"}
              </span>
              {sub?.status === "trial" && trialDaysLeft !== null && (
                <span className="text-sm opacity-80">
                  {trialDaysLeft > 0 ? `${trialDaysLeft} days remaining` : "Trial ended"}
                </span>
              )}
              {sub?.status === "active" && sub.currentPeriodEnd && (
                <span className="text-sm opacity-80">
                  Renews {sub.currentPeriodEnd.toLocaleDateString("en-TZ", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
          {currentPlan && currentPlan.priceMonthly > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold">TZS {currentPlan.priceMonthly.toLocaleString()}</p>
              <p className="text-xs opacity-70">per month</p>
            </div>
          )}
        </div>

        {sub?.status === "suspended" && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <p className="text-sm font-medium">Your menu is currently hidden from customers.</p>
            <p className="text-sm opacity-80 mt-0.5">Pay your subscription to reactivate it immediately.</p>
          </div>
        )}

        {sub?.status === "grace" && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <p className="text-sm font-medium">Payment overdue — your menu will be suspended soon.</p>
            <p className="text-sm opacity-80 mt-0.5">Pay now to avoid interruption.</p>
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">
          {sub?.status === "active" ? "Change plan" : "Upgrade your plan"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan?.id;
            const features = PLAN_FEATURES[plan.name] ?? [];

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 flex flex-col ${
                  isCurrent
                    ? "border-amber-400 bg-amber-50"
                    : "border-stone-100 bg-white shadow-sm"
                }`}
              >
                {isCurrent && (
                  <span className="self-start text-[10px] font-bold bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wide">
                    Current plan
                  </span>
                )}
                <p className="font-bold text-stone-900 text-lg">{plan.displayName}</p>
                <div className="mt-1 mb-4">
                  {plan.priceMonthly === 0 ? (
                    <span className="text-2xl font-bold text-stone-800">Free</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-stone-900">
                        TZS {plan.priceMonthly.toLocaleString()}
                      </span>
                      <span className="text-stone-400 text-sm"> / month</span>
                    </>
                  )}
                </div>

                <ul className="space-y-1.5 flex-1 mb-5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-600">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <span className="block text-center text-sm text-stone-400 py-2.5 border border-stone-200 rounded-xl">
                    Active
                  </span>
                ) : (
                  <PayButton planId={plan.id} planName={plan.displayName} priceMonthly={plan.priceMonthly} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment instructions */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <h3 className="font-semibold text-stone-800 mb-2">How to pay</h3>
        <ol className="space-y-1.5 text-sm text-stone-600 list-decimal list-inside">
          <li>Select a plan above and click &ldquo;Pay now&rdquo;</li>
          <li>Enter your M-Pesa / Tigo Pesa / Airtel Money number</li>
          <li>You&apos;ll receive a payment prompt on your phone</li>
          <li>Confirm the payment — your account activates within 1 minute</li>
        </ol>
        <p className="text-xs text-stone-400 mt-3">
          Payments are processed securely via Azampay. Currency: TZS.
          Contact <a href="mailto:support@himatech.co.tz" className="text-amber-600 hover:underline">support@himatech.co.tz</a> for help.
        </p>
      </div>

      {/* Payment history */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-3">Payment history</h2>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Provider</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-stone-50 last:border-0">
                    <td className="px-4 py-3 text-stone-500">
                      {p.createdAt.toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-800">TZS {p.amountTZS.toLocaleString()}</td>
                    <td className="px-4 py-3 text-stone-500 capitalize">{p.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                        p.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/admin" className="text-sm text-stone-400 hover:text-stone-600">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function PayButton({ planId, planName, priceMonthly }: { planId: string; planName: string; priceMonthly: number }) {
  const params = new URLSearchParams({
    planId,
    planName,
    price: String(priceMonthly),
  });
  return (
    <a
      href={`/admin/billing/pay?${params.toString()}`}
      className="block text-center bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm py-2.5 rounded-xl transition-colors"
    >
      {priceMonthly === 0 ? "Switch to free" : `Pay TZS ${priceMonthly.toLocaleString()} →`}
    </a>
  );
}

