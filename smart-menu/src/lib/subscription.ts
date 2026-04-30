import { prisma } from "./prisma";

export async function getSubscription(restaurantId: string) {
  return prisma.subscription.findUnique({
    where: { restaurantId },
    include: { plan: true },
  });
}

export async function canAddItem(restaurantId: string): Promise<{ allowed: boolean; reason?: string }> {
  const sub = await getSubscription(restaurantId);

  if (!sub) return { allowed: false, reason: "No active subscription" };

  if (sub.status === "suspended") {
    return { allowed: false, reason: "Your account is suspended. Please renew to add items." };
  }

  const { plan } = sub;

  if (plan.maxItems === -1) return { allowed: true };

  const count = await prisma.menuItem.count({ where: { restaurantId } });

  if (count >= plan.maxItems) {
    return {
      allowed: false,
      reason: `You've reached the ${plan.maxItems}-item limit on the ${plan.displayName} plan. Upgrade to add more dishes.`,
    };
  }

  return { allowed: true };
}

export async function hasFeature(
  restaurantId: string, 
  feature: "hasAR" | "hasAnalytics" | "hasImageUpload" | "hasMultiBranch"
) {
  const sub = await getSubscription(restaurantId);
  if (!sub) return false;
  if (sub.status === "suspended") return false;
  
  if (feature === "hasMultiBranch") {
    return sub.plan.maxBranches > 1 || sub.plan.maxBranches === -1;
  }
  
  return sub.plan[feature];
}
