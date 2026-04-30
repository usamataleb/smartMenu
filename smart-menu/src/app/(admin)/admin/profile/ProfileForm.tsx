"use client";

import { useActionState } from "react";
import type { Restaurant } from "@/generated/prisma/client";

const INPUT = "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";

export function ProfileForm({
  restaurant,
  action,
}: {
  restaurant: Restaurant;
  action: (prev: { error?: string; success?: boolean } | null, form: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <h2 className="text-sm font-semibold text-stone-700 mb-3">Restaurant Details</h2>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{state.error}</div>
      )}
      {state?.success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Profile updated ✓</div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Restaurant name *</label>
        <input name="name" defaultValue={restaurant.name} required className={INPUT} />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
        <input name="address" defaultValue={restaurant.address ?? ""} placeholder="Street, City, Zanzibar" className={INPUT} />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Phone</label>
        <input name="phone" defaultValue={restaurant.phone ?? ""} placeholder="+255 7XX XXX XXX" className={INPUT} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
