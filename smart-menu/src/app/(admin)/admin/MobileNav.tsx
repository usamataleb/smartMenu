"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin",          label: "Dashboard",      emoji: "⊞" },
  { href: "/admin/menu",     label: "My Menu",        emoji: "📋" },
  { href: "/admin/menu/new", label: "Add new dish",   emoji: "➕", highlight: true },
  { href: "/admin/analytics",label: "Analytics",      emoji: "📊" },
  { href: "/admin/branches", label: "Branches",       emoji: "⌂", requires: "multiBranch" },
  { href: "/admin/tables",   label: "Tables",         emoji: "▦", requires: "tableQR" },
  { href: "/admin/profile",  label: "Profile",        emoji: "🏪" },
  { href: "/admin/billing",  label: "Billing & Plans", emoji: "💳" },
];

export function MobileNav({
  email,
  isSuperadmin,
  canMultiBranch,
  hasTableQR,
}: {
  email: string;
  isSuperadmin: boolean;
  canMultiBranch: boolean;
  hasTableQR: boolean;
}) {
  const [open, setOpen] = useState(false);
  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.requires === "multiBranch") return canMultiBranch;
    if (item.requires === "tableQR") return hasTableQR;
    return true;
  });

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors"
        aria-label="Open menu"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-stone-600">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-stone-100 shrink-0">
          <p className="font-bold text-stone-900 text-sm">Navigation</p>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Superadmin pill */}
        {isSuperadmin && (
          <Link
            href="/superadmin"
            onClick={() => setOpen(false)}
            className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-700 flex-1">Super Admin Panel</span>
            <span className="text-amber-400">↗</span>
          </Link>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                n.highlight
                  ? "bg-amber-500 text-stone-900 hover:bg-amber-400 font-bold"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg w-6 text-center">{n.emoji}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User section + sign out */}
        <div className="border-t border-stone-100 p-4 space-y-3 shrink-0">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 text-sm font-bold shrink-0">
              {email.slice(0, 1).toUpperCase()}
            </div>
            <p className="text-sm text-stone-500 truncate">{email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
