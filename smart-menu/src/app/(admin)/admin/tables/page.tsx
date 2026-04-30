import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTable, deleteTable } from "./actions";

export const dynamic = "force-dynamic";

async function generateQR(url: string) {
  return QRCode.toDataURL(url, {
    width: 260,
    margin: 2,
    color: { dark: "#1c1917", light: "#ffffff" },
  });
}

export default async function TablesPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    include: {
      tables: { orderBy: { number: "asc" } },
      subscription: { include: { plan: true } },
    },
  });
  if (!restaurant) redirect("/admin/login");

  const hasTableQR = restaurant.subscription?.plan.hasTableQR ?? false;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const rows = await Promise.all(
    restaurant.tables.map(async (table) => {
      const menuUrl = `${baseUrl}/menu/${restaurant.slug}?table=${table.number}`;
      return { table, menuUrl, qrDataUrl: await generateQR(menuUrl) };
    })
  );

  if (!hasTableQR) {
    return (
      <div className="max-w-2xl">
        <Link href="/admin" className="text-sm text-stone-400 hover:text-stone-600">← Dashboard</Link>
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Business plan</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Table QR codes are locked</h1>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            Upgrade to Business to create a QR code for each table and identify where each menu scan came from.
          </p>
          <Link
            href="/admin/billing"
            className="mt-5 inline-flex rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-stone-900 transition-colors hover:bg-amber-400"
          >
            View Business plan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-stone-400 hover:text-stone-600">← Dashboard</Link>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Table QR Codes</h1>
          <p className="mt-1 text-sm text-stone-500">
            Create one QR code per table. Each link opens your menu with the table number attached.
          </p>
        </div>
      </div>

      <form action={createTable} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-bold text-stone-900">Add or update a table</p>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto]">
          <label>
            <span className="mb-1 block text-xs font-semibold text-stone-500">Number</span>
            <input
              name="number"
              type="number"
              min="1"
              max="999"
              required
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="12"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-stone-500">Label</span>
            <input
              name="label"
              maxLength={60}
              className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              placeholder="Window seat"
            />
          </label>
          <button className="self-end rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-stone-900 transition-colors hover:bg-amber-400">
            Save
          </button>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center">
          <p className="font-semibold text-stone-700">No table QR codes yet</p>
          <p className="mt-1 text-sm text-stone-400">Add your first table above.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ table, menuUrl, qrDataUrl }) => (
            <div key={table.id} className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">Table</p>
                  <h2 className="text-xl font-black text-stone-900">{table.number}</h2>
                  {table.label && <p className="text-sm text-stone-500">{table.label}</p>}
                </div>
                <form action={deleteTable.bind(null, table.id)}>
                  <button className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50">
                    Delete
                  </button>
                </form>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR code for table ${table.number}`} className="mx-auto h-44 w-44 rounded-xl border border-stone-100" />
              <p className="mt-4 break-all font-mono text-[11px] text-stone-400">{menuUrl}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={qrDataUrl}
                  download={`${restaurant.slug}-table-${table.number}-qr.png`}
                  className="rounded-xl bg-amber-500 py-2.5 text-center text-xs font-bold text-stone-900 transition-colors hover:bg-amber-400"
                >
                  Download
                </a>
                <a
                  href={menuUrl}
                  target="_blank"
                  className="rounded-xl border border-stone-200 py-2.5 text-center text-xs font-semibold text-stone-600 transition-colors hover:bg-stone-50"
                >
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
