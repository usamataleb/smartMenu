"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { MenuItem } from "@/generated/prisma/client";

function formatTZS(n: number) { return `TZS ${n.toLocaleString()}`; }

const AR_BADGE: Record<string, { label: string; cls: string }> = {
  none:     { label: "No AR",   cls: "text-stone-400 bg-stone-50 border-stone-200" },
  pending:  { label: "Pending", cls: "text-amber-600 bg-amber-50 border-amber-200" },
  assigned: { label: "3D ✓",   cls: "text-violet-600 bg-violet-50 border-violet-200" },
};

const TAG_LABELS: Record<string, string> = {
  vegan: "🌱 Vegan",
  vegetarian: "🥗 Veg",
  halal: "☪️ Halal",
  spicy: "🌶️ Spicy",
  nuts: "🥜 Nuts",
  "gluten-free": "🌾 GF",
};

interface Props {
  initialItems: MenuItem[];
  hasAR: boolean;
  onToggle: (id: string, available: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function SortableMenu({ initialItems, hasAR, onToggle, onDelete }: Props) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);
  const dragId = useRef<string | null>(null);
  const overId  = useRef<string | null>(null);

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  function handleDragStart(id: string) { dragId.current = id; }
  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    overId.current = id;
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!dragId.current || !overId.current || dragId.current === overId.current) return;

    const from = items.findIndex((i) => i.id === dragId.current);
    const to   = items.findIndex((i) => i.id === overId.current);
    if (from === -1 || to === -1) return;

    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    dragId.current = null;
    overId.current = null;

    setSaving(true);
    try {
      await fetch("/api/admin/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((i) => i.id) }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {saving && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Saving order…
        </div>
      )}

      <div className="space-y-8" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        {Object.entries(byCategory).map(([category, catItems]) => (
          <section key={category}>
            <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">
              {category} · {catItems.length}
            </h2>
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
              {catItems.map((item, idx) => {
                const arBadge = AR_BADGE[item.arStatus] ?? AR_BADGE.none;
                const tagList = item.tags ? item.tags.split(",").filter(Boolean) : [];

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-grab active:cursor-grabbing transition-colors hover:bg-stone-50 ${idx !== catItems.length - 1 ? "border-b border-stone-50" : ""}`}
                  >
                    {/* Drag handle */}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-stone-300 shrink-0">
                      <circle cx="9" cy="7" r="1.5" /><circle cx="15" cy="7" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="17" r="1.5" /><circle cx="15" cy="17" r="1.5" />
                    </svg>

                    {/* Availability dot */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${item.available ? "bg-amber-400" : "bg-stone-200"}`} />

                    {/* Thumbnail */}
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-stone-100 shrink-0 flex items-center justify-center text-stone-300 text-sm">📷</div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${item.available ? "text-stone-900" : "text-stone-400"}`}>
                        {item.name}
                      </p>
                      {tagList.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {tagList.map((t) => (
                            <span key={t} className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">
                              {TAG_LABELS[t] ?? t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AR badge */}
                    {hasAR && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 hidden sm:inline ${arBadge.cls}`}>
                        {arBadge.label}
                      </span>
                    )}

                    {/* Price */}
                    <span className="text-sm font-bold text-stone-700 shrink-0 hidden sm:block">{formatTZS(item.price)}</span>

                    {/* Toggle */}
                    <button
                      onClick={() => {
                        const next = !item.available;
                        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: next } : i));
                        onToggle(item.id, next);
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-colors shrink-0 ${
                        item.available ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" : "bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200"
                      }`}
                    >
                      {item.available ? "Live" : "Hidden"}
                    </button>

                    {/* Edit */}
                    <Link href={`/admin/menu/${item.id}/edit`} className="text-xs text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded shrink-0">
                      Edit
                    </Link>

                    {/* AR request */}
                    {hasAR && item.arStatus !== "assigned" && (
                      <Link href={`/admin/menu/${item.id}/ar-request`} className="text-xs text-violet-500 hover:text-violet-700 transition-colors px-2 py-1 rounded shrink-0 hidden sm:block">
                        {item.arStatus === "pending" ? "AR pending" : "+ AR"}
                      </Link>
                    )}

                    {/* Delete */}
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${item.name}"?`)) return;
                        setItems((prev) => prev.filter((i) => i.id !== item.id));
                        await onDelete(item.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
