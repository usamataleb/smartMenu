import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

async function updateProfile(prevState: { error?: string; success?: boolean } | null, formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const role         = (session?.user as { role?: string })?.role;
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId || (role !== "owner" && role !== "superadmin")) return { error: "Not authenticated" };

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) return { error: "Restaurant name is required" };

  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { name, address: address || null, phone: phone || null },
  });

  revalidatePath("/admin/profile");
  revalidatePath("/admin");
  return { success: true };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) redirect("/admin/login");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-stone-900 mb-6">Restaurant Profile</h1>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6">
        <ProfileForm restaurant={restaurant} action={updateProfile} />
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-stone-700 mb-3">Account</h2>
        <div className="text-sm text-stone-500 space-y-1.5">
          <p>Email: <span className="text-stone-700">{session?.user?.email}</span></p>
          <p>Menu URL: <a href={`/menu/${restaurant.slug}`} target="_blank" className="text-amber-500 hover:underline">/menu/{restaurant.slug}</a></p>
          <p className="text-xs text-stone-400 mt-2">Slug cannot be changed after setup to protect existing QR codes.</p>
        </div>
      </div>
    </div>
  );
}
