"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RestaurantActions({ restaurantId, currentStatus }: { restaurantId: string; currentStatus: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleAction(action: string) {
    if (!confirm(`Are you sure you want to perform action: ${action}?`)) return;

    startTransition(async () => {
      await fetch("/api/superadmin/restaurant/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, action, reason: "Manual override via dashboard" }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "suspended" ? (
        <button
          onClick={() => handleAction("reactivate")}
          disabled={pending}
          className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Reactivate
        </button>
      ) : (
        <button
          onClick={() => handleAction("suspend")}
          disabled={pending}
          className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Suspend
        </button>
      )}

      <button
        onClick={() => handleAction("extend_trial")}
        disabled={pending}
        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
      >
        +7 Days Trial
      </button>

      <button
        onClick={() => handleAction("waive_payment")}
        disabled={pending}
        className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
      >
        Waive 30 Days Free
      </button>
    </div>
  );
}
