import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const canMultiBranch = await hasFeature(restaurantId, "hasMultiBranch");
  if (!canMultiBranch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="text-5xl">🏪</div>
        <h1 className="text-2xl font-bold text-stone-900">Multi-Branch Locked</h1>
        <p className="text-stone-500 max-w-sm">
          Upgrade to the Business plan to manage multiple locations and branches under one account.
        </p>
        <a
          href="/admin/billing"
          className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-colors mt-2"
        >
          Upgrade Plan
        </a>
      </div>
    );
  }

  const branches = await prisma.branch.findMany({
    where: { restaurantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Branches</h1>
          <p className="text-stone-500 text-sm mt-1">Manage your restaurant locations</p>
        </div>
        <a 
          href="/admin/branches/new"
          className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Add Branch
        </a>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white border border-stone-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="text-4xl mb-3">🏪</div>
          <h3 className="font-bold text-stone-800">No branches yet</h3>
          <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto">
            You can create distinct menus and URLs for your different physical locations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-stone-900 text-lg">{branch.name}</h3>
              {branch.address && (
                <p className="text-stone-500 text-sm mt-1">{branch.address}</p>
              )}
              <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">/menu/{branch.slug}</span>
                <a 
                  href={`/menu/${branch.slug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-semibold text-amber-600 hover:text-amber-700"
                >
                  View Menu →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
