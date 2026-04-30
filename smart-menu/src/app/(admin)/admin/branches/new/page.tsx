"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create branch");
      }

      router.push("/admin/branches");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link href="/admin/branches" className="text-sm text-stone-400 hover:text-stone-600 mb-4 inline-block">
          ← Back to Branches
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Add New Branch</h1>
        <p className="text-stone-500 text-sm mt-1">Create a new location under your business.</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-stone-700 mb-1.5">
              Branch Name
            </label>
            <input
              id="name"
              name="name"
              required
              minLength={2}
              placeholder="e.g. Masaki Branch"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-semibold text-stone-700 mb-1.5">
              Address (Optional)
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              placeholder="e.g. 123 Chole Rd, Masaki"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold text-sm py-3.5 rounded-xl transition-colors"
          >
            {loading ? "Creating..." : "Create Branch"}
          </button>
        </form>
      </div>
    </div>
  );
}
