"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const ModelPreview = dynamic(() => import("@/components/ModelPreview"), { ssr: false });

const WARN_SIZE = 5 * 1024 * 1024;
const MAX_SIZE  = 8 * 1024 * 1024;

export default function UploadARModelPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileSize(f.size);
    setError("");
    if (f.size > MAX_SIZE) {
      setError("File is too large. Maximum size is 8 MB.");
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) { setError("File too large."); return; }

    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/superadmin/ar-models", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Upload failed"); setLoading(false); return; }
    router.push("/superadmin/ar-models");
    router.refresh();
  }

  const sizeKB = Math.round(fileSize / 1024);
  const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
  const sizeLabel = fileSize > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔮</span>
          <p className="text-sm font-bold">Upload 3D Model</p>
        </div>
        <Link href="/superadmin/ar-models" className="text-xs text-stone-400 hover:text-white">
          ← Back to library
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">GLB File *</label>
            <input
              ref={fileRef}
              name="file"
              type="file"
              accept=".glb"
              required
              onChange={onFileChange}
              className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-stone-900 hover:file:bg-amber-400 cursor-pointer"
            />
            {fileSize > 0 && (
              <p className={`text-xs mt-1.5 ${fileSize > MAX_SIZE ? "text-red-600 font-semibold" : fileSize > WARN_SIZE ? "text-amber-600" : "text-stone-400"}`}>
                {fileSize > MAX_SIZE ? `❌ ${sizeLabel} — too large (max 8 MB)` : fileSize > WARN_SIZE ? `⚠️ ${sizeLabel} — consider compressing with gltf-transform` : `✓ ${sizeLabel}`}
              </p>
            )}
          </div>

          {preview && (
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">Preview</label>
              <ModelPreview src={preview} height={220} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Model Name *</label>
            <input
              name="name"
              required
              placeholder="e.g. Grilled Chicken Plate"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1.5">Tags (comma-separated)</label>
            <input
              name="tags"
              placeholder="e.g. chicken, grilled, main course"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || fileSize > MAX_SIZE}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Uploading…" : "Upload to library"}
          </button>
        </form>
      </div>
    </div>
  );
}
