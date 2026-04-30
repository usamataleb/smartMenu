"use client";

import { useTransition } from "react";
import { deleteMenuItem } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    startTransition(() => deleteMenuItem(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 transition-colors px-2 py-1 rounded"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
