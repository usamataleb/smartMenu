import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PublishToggle from "./PublishToggle";

export const dynamic = "force-dynamic";

export default async function ARModelsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin");

  const models = await prisma.aRModel.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { assignments: true } } },
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔮</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin</p>
            <p className="text-sm font-bold">AR Model Library</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/superadmin/ar-requests" className="text-xs text-stone-400 hover:text-white transition-colors">
            Requests queue
          </Link>
          <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">3D Model Library</h1>
            <p className="text-stone-500 text-sm mt-0.5">{models.length} models · {models.filter(m => m.isPublished).length} published</p>
          </div>
          <Link
            href="/superadmin/ar-models/new"
            className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-4 py-2 rounded-xl transition-colors"
          >
            + Upload model
          </Link>
        </div>

        {models.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center text-stone-400">
            <div className="text-4xl mb-3">🔮</div>
            <p className="font-medium">No models yet</p>
            <p className="text-sm mt-1">Upload .glb files from Poly Pizza or Sketchfab to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-3 py-3">Tags</th>
                  <th className="text-left px-3 py-3">Size</th>
                  <th className="text-left px-3 py-3">Assigned</th>
                  <th className="text-left px-3 py-3">Published</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-stone-800">{m.name}</p>
                      <p className="text-xs text-stone-400 font-mono">{m.id.slice(0, 12)}…</p>
                    </td>
                    <td className="px-3 py-3 text-stone-500 text-xs">{m.tags || "—"}</td>
                    <td className="px-3 py-3 text-stone-500 text-xs">
                      {m.sizeBytes > 1024 * 1024
                        ? `${(m.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                        : `${Math.round(m.sizeBytes / 1024)} KB`}
                    </td>
                    <td className="px-3 py-3 text-stone-500">{m._count.assignments}</td>
                    <td className="px-3 py-3">
                      <PublishToggle id={m.id} isPublished={m.isPublished} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
