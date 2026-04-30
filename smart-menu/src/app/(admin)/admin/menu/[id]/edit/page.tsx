import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ItemForm } from "../../ItemForm";
import { updateMenuItem } from "../../actions";

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const item = await prisma.menuItem.findFirst({ where: { id, restaurantId } });
  if (!item) notFound();

  const boundAction = updateMenuItem.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/menu" className="text-stone-400 hover:text-stone-600 text-sm">
          ← My Menu
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-sm text-stone-600">Edit item</span>
      </div>

      <h1 className="text-xl font-bold text-stone-900 mb-6">Edit: {item.name}</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <ItemForm item={item} action={boundAction} submitLabel="Save changes" />
      </div>
    </div>
  );
}
