"use client";

import { useTransition, useOptimistic } from "react";
import { toggleAvailability } from "./actions";

export function ToggleButton({ id, available }: { id: string; available: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(available);
  const [, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      setOptimistic(!optimistic);
      await toggleAvailability(id, !optimistic);
    });
  }

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        optimistic ? "bg-amber-500" : "bg-stone-200"
      }`}
      title={optimistic ? "Mark unavailable" : "Mark available"}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
          optimistic ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
