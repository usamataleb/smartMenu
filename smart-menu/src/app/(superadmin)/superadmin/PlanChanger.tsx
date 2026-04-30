"use client";

import { useTransition, useState } from "react";

interface Plan { id: string; displayName: string; }

export function PlanChanger({
  restaurantId,
  currentPlanId,
  plans,
}: {
  restaurantId: string;
  currentPlanId: string;
  plans: Plan[];
}) {
  const [selected, setSelected] = useState(currentPlanId);
  const [pending, startTransition] = useTransition();

  async function handleChange(newPlanId: string) {
    setSelected(newPlanId);
    startTransition(async () => {
      await fetch("/api/superadmin/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, planId: newPlanId }),
      });
    });
  }

  return (
    <select
      value={selected}
      onChange={(e) => handleChange(e.target.value)}
      disabled={pending}
      className="text-xs border border-stone-200 rounded-lg px-2 py-1.5 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
    >
      {plans.map((p) => (
        <option key={p.id} value={p.id}>{p.displayName}</option>
      ))}
    </select>
  );
}
