import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Plans ──────────────────────────────────────────────────────────────────
  const starterPlan = await prisma.plan.upsert({
    where: { name: "starter" },
    update: {},
    create: {
      name: "starter",
      displayName: "Starter",
      priceMonthly: 0,
      priceAnnual: 0,
      maxItems: 10,
      maxBranches: 1,
      hasAR: false,
      hasImageUpload: false,
      hasAnalytics: false,
      hasCustomBranding: false,
      hasTableQR: false,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { name: "professional" },
    update: {},
    create: {
      name: "professional",
      displayName: "Professional",
      priceMonthly: 50000,
      priceAnnual: 480000,
      maxItems: -1,
      maxBranches: 1,
      hasAR: true,
      hasImageUpload: true,
      hasAnalytics: true,
      hasCustomBranding: false,
      hasTableQR: false,
    },
  });

  await prisma.plan.upsert({
    where: { name: "business" },
    update: {},
    create: {
      name: "business",
      displayName: "Business",
      priceMonthly: 120000,
      priceAnnual: 1152000,
      maxItems: -1,
      maxBranches: 5,
      hasAR: true,
      hasImageUpload: true,
      hasAnalytics: true,
      hasCustomBranding: true,
      hasTableQR: true,
    },
  });

  // ── Demo restaurant ────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "zanzibar-pizza" },
    update: {},
    create: {
      name: "Zanzibar Pizza",
      slug: "zanzibar-pizza",
      address: "Forodhani Gardens, Stone Town, Zanzibar",
      phone: "+255 777 000 000",
      onboardingComplete: true,
    },
  });

  // ── Subscription (demo → professional trial) ───────────────────────────────
  await prisma.subscription.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      planId: proPlan.id,
      status: "trial",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Owner account ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "owner@zanzibar-pizza.com" },
    update: {},
    create: {
      email: "owner@zanzibar-pizza.com",
      passwordHash,
      role: "owner",
      restaurantId: restaurant.id,
    },
  });

  // ── Super admin ────────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@himatech.co.tz" },
    update: {},
    create: {
      email: "admin@himatech.co.tz",
      passwordHash: superAdminHash,
      role: "superadmin",
      restaurantId: restaurant.id,
    },
  });

  // ── Menu items ─────────────────────────────────────────────────────────────
  const items = [
    { 
      name: "Zanzibar Pizza", 
      description: "Thin crispy crepe folded with egg, meat, and vegetables", 
      price: 5000, 
      category: "Street Food", 
      sortOrder: 1, 
      glbUrl: "/models/sample-food.glb" 
    },
    { name: "Octopus Curry", description: "Freshly caught octopus simmered in rich coconut curry", price: 18000, category: "Seafood", sortOrder: 1 },
    { name: "Pilau Rice", description: "Spiced rice cooked with beef and whole spices", price: 8000, category: "Rice Dishes", sortOrder: 1 },
    { name: "Urojo Soup", description: "Traditional Zanzibari mix soup with bhajias and coconut", price: 4000, category: "Soups", sortOrder: 1 },
    { name: "Fresh Coconut Juice", description: "Chilled straight from the coconut with a straw", price: 3000, category: "Drinks", sortOrder: 1 },
  ];

  for (const item of items) {
    const id = `seed-${item.name.toLowerCase().replace(/\s+/g, "-")}`;
    await prisma.menuItem.upsert({
      where: { id },
      update: {},
      create: { id, ...item, restaurantId: restaurant.id },
    });
  }

  // ── Seed a second demo restaurant ──────────────────────────────────────────
  const r2 = await prisma.restaurant.upsert({
    where: { slug: "stone-town-grill" },
    update: {},
    create: {
      name: "Stone Town Grill",
      slug: "stone-town-grill",
      address: "Kenyatta Road, Stone Town, Zanzibar",
      onboardingComplete: false,
    },
  });
  await prisma.subscription.upsert({
    where: { restaurantId: r2.id },
    update: {},
    create: {
      restaurantId: r2.id,
      planId: starterPlan.id,
      status: "trial",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  await prisma.user.upsert({
    where: { email: "owner@stonetowngrill.com" },
    update: {},
    create: {
      email: "owner@stonetowngrill.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "owner",
      restaurantId: r2.id,
    },
  });

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
