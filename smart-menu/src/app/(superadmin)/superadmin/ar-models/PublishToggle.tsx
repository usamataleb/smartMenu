"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PublishToggle({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      await fetch(`/api/superadmin/ar-models/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
        isPublished
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
      }`}
    >
      {pending ? "…" : isPublished ? "Published" : "Draft"}
    </button>
  );
}
