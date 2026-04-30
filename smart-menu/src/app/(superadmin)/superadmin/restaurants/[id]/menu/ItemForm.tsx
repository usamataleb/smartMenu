"use client";

import { useActionState } from "react";

type State = { error?: string } | null;

interface Props {
  action: (prevState: State, formData: FormData) => Promise<State>;
  defaultValues?: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    imageUrl?: string;
    glbUrl?: string;
    available?: boolean;
  };
  submitLabel?: string;
  cancelHref: string;
}

export function ItemForm({ action, defaultValues = {}, submitLabel = "Save item", cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Name *</label>
          <input
            name="name"
            defaultValue={defaultValues.name ?? ""}
            required
            maxLength={100}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. Grilled Chicken"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Category *</label>
          <input
            name="category"
            defaultValue={defaultValues.category ?? ""}
            required
            maxLength={60}
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. Main Course"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Description</label>
        <textarea
          name="description"
          defaultValue={defaultValues.description ?? ""}
          maxLength={500}
          rows={2}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
          placeholder="Brief description…"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Price (TZS) *</label>
        <input
          name="price"
          type="number"
          min={0}
          step={500}
          defaultValue={defaultValues.price ?? ""}
          required
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="15000"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">Image URL</label>
        <input
          name="imageUrl"
          type="url"
          defaultValue={defaultValues.imageUrl ?? ""}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="https://…"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">3D Model URL (.glb)</label>
        <input
          name="glbUrl"
          type="url"
          defaultValue={defaultValues.glbUrl ?? ""}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="https://…/model.glb"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          name="available"
          type="checkbox"
          defaultChecked={defaultValues.available ?? true}
          className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
        />
        <span className="text-sm text-stone-700">Available on menu</span>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <a
          href={cancelHref}
          className="text-sm text-stone-500 hover:text-stone-700 border border-stone-200 hover:border-stone-300 px-4 py-2.5 rounded-xl transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
