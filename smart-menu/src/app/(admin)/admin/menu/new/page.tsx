import Link from "next/link";
import { ItemForm } from "../ItemForm";
import { createMenuItem } from "../actions";

export default function NewMenuItemPage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/menu" className="text-stone-400 hover:text-stone-600 text-sm">
          ← My Menu
        </Link>
        <span className="text-stone-300">/</span>
        <span className="text-sm text-stone-600">New item</span>
      </div>

      <h1 className="text-xl font-bold text-stone-900 mb-6">Add a new dish</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <ItemForm action={createMenuItem} submitLabel="Add dish" />
      </div>
    </div>
  );
}
