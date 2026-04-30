import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function generateQR(url: string) {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#1c1917", light: "#ffffff" },
  });
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      subscription: { include: { plan: true } },
      menuItems: { select: { id: true, category: true, available: true } },
    },
  });
  if (!restaurant) redirect("/admin/login");

  const menuUrl   = `${process.env.NEXTAUTH_URL}/menu/${restaurant.slug}`;
  const qrDataUrl = await generateQR(menuUrl);

  const sub  = restaurant.subscription;
  const plan = sub?.plan;

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / 86400000))
    : null;

  const totalItems     = restaurant.menuItems.length;
  const availableItems = restaurant.menuItems.filter((i) => i.available).length;
  const categories     = new Set(restaurant.menuItems.map((i) => i.category)).size;
  const maxItems       = plan?.maxItems ?? 10;
  const usagePct       = maxItems > 0 ? Math.min(100, Math.round((totalItems / maxItems) * 100)) : 0;
  const isNearLimit    = maxItems > 0 && usagePct >= 80;
  const isAtLimit      = maxItems > 0 && totalItems >= maxItems;
  const subStatus      = sub?.status ?? "trial";

  return (
    <div className="space-y-6">

      {/* ── Onboarding nudge ── */}
      {!restaurant.onboardingComplete && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-amber-900 text-sm">Complete your setup to go live</p>
            <p className="text-xs text-amber-700 mt-0.5">Add your first dishes and get your QR code — takes 2 minutes.</p>
          </div>
          <Link href="/onboarding" className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors text-center">
            Complete setup →
          </Link>
        </div>
      )}

      {/* ── Subscription alert ── */}
      {(subStatus === "suspended" || subStatus === "grace") && (
        <div className={`rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${subStatus === "suspended" ? "bg-red-50 border-red-300" : "bg-orange-50 border-orange-300"}`}>
          <div>
            <p className={`font-bold text-sm ${subStatus === "suspended" ? "text-red-900" : "text-orange-900"}`}>
              {subStatus === "suspended" ? "Account suspended — your menu is offline" : "Payment overdue — pay now to avoid suspension"}
            </p>
            <p className={`text-xs mt-0.5 ${subStatus === "suspended" ? "text-red-700" : "text-orange-700"}`}>
              Go to Billing to renew your subscription.
            </p>
          </div>
          <Link href="/admin/billing" className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-5 py-2.5 rounded-xl transition-colors text-center">
            Go to Billing →
          </Link>
        </div>
      )}

      {/* ── Restaurant hero ── */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold mb-1">Your restaurant</p>
            <h1 className="text-2xl font-bold text-stone-900">{restaurant.name}</h1>
            <a
              href={menuUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 hover:underline font-mono mt-1"
            >
              {menuUrl}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </a>
          </div>

          {/* Plan + status */}
          <div className="text-right">
            <p className="text-xs text-stone-400 mb-1">{plan?.displayName ?? "Starter"} Plan</p>
            {subStatus === "trial" && (
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full">
                Free Trial{trialDaysLeft !== null ? ` · ${trialDaysLeft}d left` : ""}
              </span>
            )}
            {subStatus === "active" && (
              <span className="bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full">
                Active
              </span>
            )}
            {subStatus === "grace" && (
              <span className="bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold px-3 py-1 rounded-full">
                Grace Period
              </span>
            )}
            {subStatus === "suspended" && (
              <span className="bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1 rounded-full">
                Suspended
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`bg-white rounded-2xl border shadow-sm p-4 ${isNearLimit ? "border-amber-300" : "border-stone-100"}`}>
          <p className="text-xs text-stone-400 font-medium mb-2">Menu items</p>
          <p className={`text-3xl font-black ${isAtLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-stone-900"}`}>
            {totalItems}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {maxItems > 0 ? `of ${maxItems} max` : "unlimited"}
          </p>
          {maxItems > 0 && (
            <div className="mt-2 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-amber-400" : "bg-green-400"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <p className="text-xs text-stone-400 font-medium mb-2">Available now</p>
          <p className="text-3xl font-black text-stone-900">{availableItems}</p>
          <p className="text-[11px] text-stone-400 mt-1">shown to customers</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <p className="text-xs text-stone-400 font-medium mb-2">Hidden</p>
          <p className="text-3xl font-black text-stone-900">{totalItems - availableItems}</p>
          <p className="text-[11px] text-stone-400 mt-1">not on menu</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <p className="text-xs text-stone-400 font-medium mb-2">Categories</p>
          <p className="text-3xl font-black text-stone-900">{categories}</p>
          <p className="text-[11px] text-stone-400 mt-1">groups on menu</p>
        </div>
      </div>

      {/* ── Main grid: Actions + QR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Primary CTA */}
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Manage your restaurant</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <Link href="/admin/menu/new" className="flex items-center gap-4 bg-amber-500 hover:bg-amber-400 rounded-2xl p-5 transition-colors group">
                <div className="w-11 h-11 bg-stone-900/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-stone-900/15 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-900">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div>
                  <p className="font-black text-stone-900 text-sm">Add new dish</p>
                  <p className="text-xs text-stone-900/60 mt-0.5">Name, price, photo, category</p>
                </div>
              </Link>

              <Link href="/admin/menu" className="flex items-center gap-4 bg-white hover:bg-stone-50 border border-stone-100 shadow-sm rounded-2xl p-5 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600">
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                    <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Manage menu</p>
                  <p className="text-xs text-stone-400 mt-0.5">Edit, hide & delete items</p>
                </div>
              </Link>

              <Link href="/admin/profile" className="flex items-center gap-4 bg-white hover:bg-stone-50 border border-stone-100 shadow-sm rounded-2xl p-5 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Restaurant profile</p>
                  <p className="text-xs text-stone-400 mt-0.5">Name, address, phone</p>
                </div>
              </Link>

              <Link href="/admin/billing" className="flex items-center gap-4 bg-white hover:bg-stone-50 border border-stone-100 shadow-sm rounded-2xl p-5 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Billing & Plans</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {plan?.displayName ?? "Free"} · {subStatus === "trial" ? "Upgrade" : subStatus === "active" ? "Manage" : "Renew"}
                  </p>
                </div>
              </Link>

              <Link href="/admin/analytics" className="flex items-center gap-4 bg-white hover:bg-stone-50 border border-stone-100 shadow-sm rounded-2xl p-5 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                    <line x1="2" y1="20" x2="22" y2="20" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Analytics</p>
                  <p className="text-xs text-stone-400 mt-0.5">Scans, popular dishes</p>
                </div>
              </Link>

              <Link href="/admin/tables" className="flex items-center gap-4 bg-white hover:bg-stone-50 border border-stone-100 shadow-sm rounded-2xl p-5 transition-colors">
                <div className="w-11 h-11 bg-stone-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-stone-600">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-stone-800 text-sm">Table QR codes</p>
                  <p className="text-xs text-stone-400 mt-0.5">Download one QR per table</p>
                </div>
              </Link>

              <a
                href={menuUrl}
                target="_blank"
                className="flex items-center gap-4 bg-stone-900 hover:bg-stone-800 rounded-2xl p-5 transition-colors"
              >
                <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">View live menu</p>
                  <p className="text-xs text-white/50 mt-0.5">See what customers see</p>
                </div>
              </a>

            </div>
          </div>

          {/* Item limit warning */}
          {isNearLimit && (
            <div className={`rounded-2xl border px-5 py-4 flex items-center justify-between gap-4 ${isAtLimit ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <p className={`text-sm font-medium ${isAtLimit ? "text-red-800" : "text-amber-800"}`}>
                {isAtLimit
                  ? `Item limit reached — ${totalItems}/${maxItems} used. Upgrade to add more dishes.`
                  : `Approaching limit — ${totalItems}/${maxItems} items used.`}
              </p>
              <Link href="/admin/billing" className="shrink-0 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-xs px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                Upgrade →
              </Link>
            </div>
          )}
        </div>

        {/* Right: QR Code */}
        <div className="flex flex-col">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Your QR code</p>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col items-center text-center flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR code" className="w-48 h-48 rounded-xl mb-4 border border-stone-100" />
            <p className="text-sm font-bold text-stone-800 mb-1">Print &amp; place on tables</p>
            <p className="text-xs text-stone-400 leading-relaxed mb-5">
              Customers scan to open your menu instantly — no app needed.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <a
                href={qrDataUrl}
                download={`${restaurant.slug}-qr.png`}
                className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Download QR (PNG)
              </a>
              <a
                href={menuUrl}
                target="_blank"
                className="border border-stone-200 hover:bg-stone-50 text-stone-600 text-sm py-3 rounded-xl transition-colors"
              >
                Open live menu ↗
              </a>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
