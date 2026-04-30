"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const ModelPreview = dynamic(() => import("@/components/ModelPreview"), { ssr: false });

interface Model {
  id: string;
  name: string;
  tags: string;
  filePath: string;
}

interface Props {
  item: { id: string; name: string; arStatus: string };
  libraryModels: Model[];
}

export default function ARRequestClient({ item, libraryModels }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"browse" | "request" | "done">("browse");
  const [search, setSearch] = useState("");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = libraryModels.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.toLowerCase().includes(search.toLowerCase())
  );

  function selfAssign() {
    if (!selectedModel) return;
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/ar-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.id, modelId: selectedModel.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setStep("done");
    });
  }

  function submitRequest() {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/admin/ar-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuItemId: item.id, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setStep("done");
    });
  }

  if (step === "done") {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-5xl">{selectedModel ? "✅" : "⏳"}</div>
        <h2 className="text-xl font-bold text-stone-900">
          {selectedModel ? "3D model assigned!" : "Request submitted!"}
        </h2>
        <p className="text-stone-500 text-sm">
          {selectedModel
            ? `Customers can now view ${item.name} in 3D on your menu.`
            : `We'll review your request and assign a 3D model within 48 hours. You'll get an email when it's ready.`}
        </p>
        <button
          onClick={() => router.push("/admin/menu")}
          className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          Back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/admin/menu" className="text-xs text-stone-400 hover:text-stone-600">← Back to menu</a>
        <h1 className="text-xl font-bold text-stone-900 mt-2">Get 3D AR model for &ldquo;{item.name}&rdquo;</h1>
        {item.arStatus === "pending" && (
          <p className="text-sm text-amber-600 mt-1">⏳ A request is already pending for this dish.</p>
        )}
      </div>

      {/* Step 1: Browse library */}
      {step === "browse" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-3">Browse our 3D library</h2>
            <p className="text-sm text-stone-500 mb-4">
              If we already have a model for your dish, you can assign it instantly — no waiting.
            </p>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by dish name or ingredient…"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-4"
            />

            {filtered.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-6">No matching models found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {filtered.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedModel?.id === m.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-100 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={m.id}
                      checked={selectedModel?.id === m.id}
                      onChange={() => setSelectedModel(m)}
                      className="accent-amber-500 mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{m.name}</p>
                      {m.tags && <p className="text-xs text-stone-400 truncate">{m.tags}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Preview selected model */}
          {selectedModel && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
              <h3 className="font-semibold text-stone-800 mb-3">Preview: {selectedModel.name}</h3>
              <ModelPreview src={selectedModel.filePath} height={200} />
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-3">
            {selectedModel && (
              <button
                onClick={selfAssign}
                disabled={pending}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {pending ? "Assigning…" : `Use "${selectedModel.name}" →`}
              </button>
            )}
            <button
              onClick={() => setStep("request")}
              className="flex-1 border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              Request custom model →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Custom request */}
      {step === "request" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
            <h2 className="font-semibold text-stone-800 mb-1">Request a custom 3D model</h2>
            <p className="text-sm text-stone-500 mb-4">
              Our team will create or find a model for your dish within 48 hours and notify you by email.
            </p>

            <label className="block text-xs font-semibold text-stone-600 mb-1.5">
              Describe the dish (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Grilled whole fish with coconut sauce, served on a banana leaf…"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("browse")}
              className="px-5 py-3 border border-stone-200 text-stone-500 rounded-xl text-sm hover:bg-stone-50 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={submitRequest}
              disabled={pending}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {pending ? "Submitting…" : "Submit request →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
