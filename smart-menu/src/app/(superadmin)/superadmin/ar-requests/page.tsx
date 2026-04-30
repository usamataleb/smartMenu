import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AssignModal from "./AssignModal";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  pending:     "bg-amber-50  text-amber-700  border-amber-200",
  in_progress: "bg-blue-50   text-blue-700   border-blue-200",
  done:        "bg-green-50  text-green-700  border-green-200",
  rejected:    "bg-stone-100 text-stone-500  border-stone-200",
};

export default async function ARRequestsPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "superadmin") redirect("/admin");

  const [requests, library] = await Promise.all([
    prisma.aRRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      include: {
        menuItem: { select: { name: true } },
      },
    }),
    prisma.aRModel.findMany({
      where: { isPublished: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, tags: true, filePath: true },
    }),
  ]);

  // Enrich with restaurant info
  const restaurantIds = [...new Set(requests.map(r => r.restaurantId))];
  const restaurants = await prisma.restaurant.findMany({
    where: { id: { in: restaurantIds } },
    include: { subscription: { include: { plan: { select: { displayName: true } } } } },
  });
  const restaurantMap = Object.fromEntries(restaurants.map(r => [r.id, r]));

  const pending  = requests.filter(r => r.status === "pending");
  const active   = requests.filter(r => r.status === "in_progress");
  const done     = requests.filter(r => r.status === "done" || r.status === "rejected");

  const ordered = [...pending, ...active, ...done];

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">📋</span>
          <div>
            <p className="text-xs text-stone-400">Super Admin</p>
            <p className="text-sm font-bold">AR Requests Queue</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/superadmin/ar-models" className="text-xs text-stone-400 hover:text-white">Model Library</Link>
          <Link href="/superadmin" className="text-xs text-stone-400 hover:text-white">← Dashboard</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">AR Requests</h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {pending.length} pending · {active.length} in progress · {done.length} done
            </p>
          </div>
        </div>

        {ordered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-12 text-center text-stone-400">
            <div className="text-4xl mb-3">✅</div>
            <p className="font-medium">No requests yet</p>
            <p className="text-sm mt-1">Requests appear here when restaurant owners ask for a 3D model.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-50 text-xs text-stone-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Restaurant</th>
                  <th className="text-left px-3 py-3">Plan</th>
                  <th className="text-left px-3 py-3">Dish</th>
                  <th className="text-left px-3 py-3">Description</th>
                  <th className="text-left px-3 py-3">Date</th>
                  <th className="text-left px-3 py-3">Status</th>
                  <th className="text-left px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((req) => {
                  const rest = restaurantMap[req.restaurantId] as typeof restaurants[0] | undefined;
                  const planName = rest?.subscription?.plan?.displayName ?? "—";
                  const statusStyle = STATUS_STYLE[req.status] ?? STATUS_STYLE.pending;
                  const isDone = req.status === "done" || req.status === "rejected";

                  return (
                    <tr key={req.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors align-top">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-stone-800">{rest?.name ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-medium text-stone-600">{planName}</span>
                      </td>
                      <td className="px-3 py-3 text-stone-700 font-medium">{req.menuItem.name}</td>
                      <td className="px-3 py-3 text-stone-400 text-xs max-w-[160px] truncate">{req.description ?? "—"}</td>
                      <td className="px-3 py-3 text-stone-400 text-xs whitespace-nowrap">
                        {req.createdAt.toLocaleDateString("en-TZ")}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusStyle}`}>
                          {req.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {!isDone && (
                          <AssignModal requestId={req.id} dishName={req.menuItem.name} models={library} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
