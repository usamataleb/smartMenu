import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const canViewAnalytics = await hasFeature(restaurantId, "hasAnalytics");
  if (!canViewAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-4">
        <div className="text-5xl">📊</div>
        <h1 className="text-2xl font-bold text-stone-900">Analytics Locked</h1>
        <p className="text-stone-500 max-w-sm">
          Upgrade your plan to see how many customers are scanning your menu and which dishes are the most popular.
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

  // 1. Total Menu Views (Last 7 Days vs Previous 7 Days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [viewsThisWeek, viewsLastWeek] = await Promise.all([
    prisma.menuPageView.count({
      where: { restaurantId, viewedAt: { gte: sevenDaysAgo } },
    }),
    prisma.menuPageView.count({
      where: {
        restaurantId,
        viewedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
      },
    }),
  ]);

  const percentChange = viewsLastWeek === 0 
    ? 100 
    : Math.round(((viewsThisWeek - viewsLastWeek) / viewsLastWeek) * 100);

  // 2. Top 5 Items by Views (All Time for simplicity)
  const topItems = await prisma.menuItem.findMany({
    where: { restaurantId },
    select: {
      id: true,
      name: true,
      _count: {
        select: { menuItemViews: true }
      }
    },
    orderBy: {
      menuItemViews: {
        _count: 'desc'
      }
    },
    take: 5
  });

  // 3. Views per day (Last 7 Days)
  const dailyViewsRaw = await prisma.$queryRaw<Array<{ day: string, count: number }>>`
    SELECT date(viewedAt) as day, count(*) as count
    FROM MenuPageView
    WHERE restaurantId = ${restaurantId} AND viewedAt >= ${sevenDaysAgo.toISOString()}
    GROUP BY date(viewedAt)
    ORDER BY date(viewedAt) ASC
  `;

  // Pad the last 7 days with zeros if missing
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split('T')[0];
    const match = dailyViewsRaw.find(r => r.day === dayStr);
    return { day: d.toLocaleDateString('en-TZ', { weekday: 'short' }), count: match ? Number(match.count) : 0 };
  });

  const maxDailyViews = Math.max(...last7Days.map(d => d.count), 10); // Minimum scale of 10

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-stone-500 text-sm mt-1">See how your menu is performing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Views Card */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-1">Total Scans (7 Days)</h2>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-4xl font-bold text-stone-900">{viewsThisWeek}</span>
            <span className={`text-sm font-bold mb-1 ${percentChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {percentChange >= 0 ? '↑' : '↓'} {Math.abs(percentChange)}% vs last week
            </span>
          </div>

          {/* Simple Sparkline Chart using flex heights */}
          <div className="mt-8 flex items-end justify-between h-24 gap-2">
            {last7Days.map((d, i) => {
              const heightPct = Math.max(5, (d.count / maxDailyViews) * 100);
              return (
                <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 bg-stone-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {d.count} scans
                    </div>
                    <div 
                      className="w-full max-w-[2rem] bg-amber-200 rounded-t-sm transition-all group-hover:bg-amber-400 cursor-default"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                    />
                  </div>
                  <span className="text-[10px] text-stone-400">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Items List */}
        <div className="bg-white border border-stone-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">Most Popular Dishes</h2>
          
          {topItems.length === 0 || topItems[0]._count.menuItemViews === 0 ? (
            <div className="text-center py-6 text-stone-400 text-sm">
              No data yet. Get more menu scans!
            </div>
          ) : (
            <div className="space-y-4">
              {topItems.map((item, index) => {
                const maxViews = topItems[0]._count.menuItemViews;
                const widthPct = Math.max(2, (item._count.menuItemViews / maxViews) * 100);
                
                return (
                  <div key={item.id} className="relative">
                    <div className="flex items-center justify-between text-sm mb-1 z-10 relative">
                      <span className="font-semibold text-stone-800 flex items-center gap-2">
                        <span className="text-stone-400 font-normal w-3">{index + 1}.</span> 
                        {item.name}
                      </span>
                      <span className="text-stone-500 font-mono text-xs">{item._count.menuItemViews} views</span>
                    </div>
                    {/* Background bar */}
                    <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full" 
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
