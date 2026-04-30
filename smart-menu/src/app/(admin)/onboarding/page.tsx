import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = (session?.user as { restaurantId?: string })?.restaurantId;
  if (!restaurantId) redirect("/admin/login");

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) redirect("/admin/login");
  if (restaurant.onboardingComplete) redirect("/admin");

  const menuUrl = `${process.env.NEXTAUTH_URL}/menu/${restaurant.slug}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { width: 240, margin: 2 });

  return (
    <OnboardingWizard
      restaurantName={restaurant.name}
      restaurantAddress={restaurant.address}
      restaurantPhone={restaurant.phone}
      menuUrl={menuUrl}
      qrDataUrl={qrDataUrl}
      slug={restaurant.slug}
    />
  );
}
