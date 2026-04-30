"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Model {
  id: string;
  name: string;
  tags: string;
  filePath: string;
}

export default function AssignModal({
  requestId,
  dishName,
  models,
}: {
  requestId: string;
  dishName: string;
  models: Model[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const filtered = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.toLowerCase().includes(search.toLowerCase())
  );

  function assign() {
    if (!selectedId) return;
    setError("");
    startTransition(async () => {
      const res = await fetch(`/api/superadmin/ar-requests/${requestId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        Assign model
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-stone-900">Assign model to &ldquo;{dishName}&rdquo;</h2>
              <button onClick={() => setOpen(false)} className="text-stone-400 hover:text-stone-700 text-lg leading-none">✕</button>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models…"
              className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />

            <div className="max-h-52 overflow-y-auto space-y-2">
              {filtered.length === 0 ? (
                <p className="text-stone-400 text-sm text-center py-4">No models match</p>
              ) : (
                filtered.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedId === m.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-100 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={selectedId === m.id}
                      onChange={() => setSelectedId(m.id)}
                      className="accent-amber-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{m.name}</p>
                      {m.tags && <p className="text-xs text-stone-400">{m.tags}</p>}
                    </div>
                  </label>
                ))
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setOpen(false)} className="flex-1 border border-stone-200 text-stone-600 py-2.5 rounded-xl text-sm hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={assign}
                disabled={!selectedId || pending}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                {pending ? "Assigning…" : "Assign →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
