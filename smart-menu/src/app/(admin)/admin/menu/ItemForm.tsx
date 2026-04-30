"use client";

import { useActionState, useRef, useState } from "react";
import type { MenuItem } from "@/generated/prisma/client";

const CATEGORIES = [
  "Street Food", "Seafood", "Rice Dishes", "Soups", "Grills",
  "Salads", "Desserts", "Drinks", "Breakfast", "Pizza", "Burgers", "Pasta",
];

const ALL_TAGS = [
  { id: "vegan",       label: "Vegan",        emoji: "🌱" },
  { id: "vegetarian",  label: "Vegetarian",   emoji: "🥗" },
  { id: "halal",       label: "Halal",        emoji: "☪️" },
  { id: "spicy",       label: "Spicy",        emoji: "🌶️" },
  { id: "nuts",        label: "Contains Nuts",emoji: "🥜" },
  { id: "gluten-free", label: "Gluten-Free",  emoji: "🌾" },
];

interface Props {
  item?: MenuItem;
  action: (prev: { error?: string } | null, form: FormData) => Promise<{ error?: string }>;
  submitLabel: string;
}

export function ItemForm({ item, action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string>(item?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [imageUrl, setImageUrl]   = useState<string>(item?.imageUrl ?? "");

  // Active dietary tags
  const [tags, setTags] = useState<Set<string>>(
    new Set((item?.tags ?? "").split(",").filter(Boolean))
  );

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploadErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.url);
    } catch (err: unknown) {
      setUploadErr(err instanceof Error ? err.message : "Upload failed");
      setPreview(item?.imageUrl ?? "");
      setImageUrl(item?.imageUrl ?? "");
    } finally {
      setUploading(false);
    }
  }

  function toggleTag(id: string) {
    setTags((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Hidden imageUrl passed to server */}
      <input type="hidden" name="imageUrl" value={imageUrl} />
      {/* Hidden tags passed to server */}
      <input type="hidden" name="tags" value={[...tags].join(",")} />

      {/* ── Image upload ── */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">Photo</label>
        <div className="flex items-start gap-4">
          {/* Preview box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-xl border-2 border-dashed border-stone-200 hover:border-amber-400 cursor-pointer bg-stone-50 flex items-center justify-center overflow-hidden shrink-0 transition-colors"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">📷</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-xs text-stone-400 mt-1.5">JPG, PNG, WebP · max 5 MB</p>
            {uploadErr && <p className="text-xs text-red-500 mt-1">{uploadErr}</p>}
          </div>
        </div>
      </div>

      {/* ── Name + Category ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Dish name *" name="name" defaultValue={item?.name} placeholder="e.g. Pilau Rice" />
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1">Category *</label>
          <input
            list="category-list"
            name="category"
            defaultValue={item?.category}
            placeholder="e.g. Rice Dishes"
            required
            className={INPUT}
          />
          <datalist id="category-list">
            {CATEGORIES.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      {/* ── Description ── */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={item?.description ?? ""}
          placeholder="Brief description of the dish…"
          rows={2}
          className={INPUT + " resize-none"}
        />
      </div>

      {/* ── Price ── */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1">Price (TZS) *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">TZS</span>
          <input
            type="number"
            name="price"
            defaultValue={item?.price ?? ""}
            placeholder="5000"
            min="0"
            step="100"
            required
            className={INPUT + " pl-12"}
          />
        </div>
      </div>

      {/* ── 3D Model URL ── */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-1">3D Model URL (.glb)</label>
        <input
          type="url"
          name="glbUrl"
          defaultValue={item?.glbUrl ?? ""}
          placeholder="https://…/model.glb"
          className={INPUT}
        />
        <p className="text-xs text-stone-400 mt-1">Optional — enables AR viewer for this dish</p>
      </div>

      {/* ── Dietary tags ── */}
      <div>
        <label className="block text-sm font-semibold text-stone-700 mb-2">Dietary tags</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                tags.has(t.id)
                  ? "bg-amber-500 border-amber-500 text-stone-900"
                  : "bg-white border-stone-200 text-stone-600 hover:border-amber-300"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Availability scheduling ── */}
      <div className="bg-stone-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-stone-700">Availability schedule</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Days available</label>
            <select name="availableDays" defaultValue={item?.availableDays ?? "everyday"} className={INPUT}>
              <option value="everyday">Every day</option>
              <option value="weekdays">Weekdays only</option>
              <option value="weekends">Weekends only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">From (time)</label>
            <input type="time" name="availableFrom" defaultValue={item?.availableFrom ?? ""} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">To (time)</label>
            <input type="time" name="availableTo" defaultValue={item?.availableTo ?? ""} className={INPUT} />
          </div>
        </div>
        <p className="text-xs text-stone-400">Leave time blank for all-day availability.</p>
      </div>

      {/* ── Available toggle ── */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="available"
          id="available"
          defaultChecked={item?.available ?? true}
          className="w-4 h-4 accent-amber-500"
        />
        <label htmlFor="available" className="text-sm font-medium text-stone-700">
          Available — show this item on the menu right now
        </label>
      </div>

      {/* ── Submit ── */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending || uploading}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <a href="/admin/menu" className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-sm transition-colors">
          Cancel
        </a>
      </div>
    </form>
  );
}

function Field({ label, name, defaultValue, placeholder }: {
  label: string; name: string; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1">{label}</label>
      <input name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required className={INPUT} />
    </div>
  );
}

const INPUT = "w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";
