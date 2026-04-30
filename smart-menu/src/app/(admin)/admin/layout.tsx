import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { MobileNav } from "./MobileNav";
import { prisma } from "@/lib/prisma";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/menu",
    label: "My Menu",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    href: "/admin/branches",
    label: "Branches",
    requires: "multiBranch",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9h1" />
        <path d="M9 13h1" />
        <path d="M9 17h1" />
      </svg>
    ),
  },
  {
    href: "/admin/tables",
    label: "Tables",
    requires: "tableQR",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/admin/billing",
    label: "Billing & Plans",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) return <>{children}</>;

  const restaurantId   = (session.user as { restaurantId?: string }).restaurantId;
  const role           = (session.user as { role?: string }).role;
  const isSuperadmin   = role === "superadmin";
  const restaurantSlug = (session.user as { restaurantSlug?: string }).restaurantSlug ?? "";

  const subscription = restaurantId
    ? await prisma.subscription.findUnique({ where: { restaurantId }, include: { plan: true } })
    : null;

  const isSuspended = subscription?.status === "suspended";
  const canMultiBranch = (subscription?.plan.maxBranches ?? 1) > 1 || subscription?.plan.maxBranches === -1;
  const hasTableQR = subscription?.plan.hasTableQR ?? false;
  const planNav = NAV.filter((n) => {
    if (n.requires === "multiBranch") return canMultiBranch;
    if (n.requires === "tableQR") return hasTableQR;
    return true;
  });
  const visibleNav  = isSuspended ? planNav.filter((n) => n.href === "/admin/billing") : planNav;

  const displayName = restaurantSlug.replace(/-/g, " ");
  const initials    = displayName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "R";

  return (
    <div className="min-h-screen bg-stone-50 flex">

      {/* ── Sidebar (md+) ── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 bg-white border-r border-stone-100 z-40">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-stone-100 shrink-0">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-stone-900 font-black text-base shrink-0">M</div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 leading-none">Smart Menu</p>
            <p className="text-[10px] text-stone-400 mt-0.5 leading-none capitalize truncate">{displayName || "Admin"}</p>
          </div>
        </div>

        {/* Superadmin pill */}
        {isSuperadmin && (
          <Link href="/superadmin" className="mx-3 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 hover:bg-amber-100 transition-colors shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-[11px] font-semibold text-amber-700 flex-1">Super Admin Mode</span>
            <span className="text-amber-400 text-xs">↗</span>
          </Link>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              {n.icon}
              {n.label}
            </Link>
          ))}

          {/* Add food shortcut */}
          {!isSuspended && (
            <Link
              href="/admin/menu/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors mt-3"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Add new dish
            </Link>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-stone-100 p-3 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-1 min-w-0">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">{initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-stone-800 capitalize truncate">{displayName || "Restaurant"}</p>
              <p className="text-[10px] text-stone-400 truncate">{session.user?.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 md:ml-60 flex flex-col min-w-0">

        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-stone-100 h-14 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-stone-900 font-black text-sm shrink-0">M</div>
            <div className="min-w-0">
              <p className="text-xs text-stone-400 leading-none">Smart Menu</p>
              <p className="text-sm font-semibold text-stone-800 leading-tight capitalize truncate max-w-[140px]">{displayName || "Admin"}</p>
            </div>
          </div>
          <MobileNav
            email={session.user?.email ?? ""}
            isSuperadmin={isSuperadmin}
            canMultiBranch={canMultiBranch}
            hasTableQR={hasTableQR}
          />
        </header>

        {/* Suspended banner */}
        {isSuspended && (
          <div className="bg-red-600 text-white text-center text-sm py-2.5 px-4 font-medium shrink-0">
            Account suspended — menu hidden.{" "}
            <Link href="/admin/billing" className="underline font-bold">Pay to reactivate →</Link>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar (phones only) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-stone-100">
        <div className="flex">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex-1 flex flex-col items-center justify-center py-3 text-stone-400 hover:text-amber-500 text-[10px] font-medium gap-1 transition-colors"
            >
              {n.icon}
              <span className="leading-none">{n.label.split(" ")[0]}</span>
            </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}
