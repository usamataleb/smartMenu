/**
 * Billing check cron — runs daily at 08:00 EAT via Vercel Cron
 * Protected by CRON_SECRET header
 *
 * What it does:
 *  1. Trial ending in 3 days → send reminder email
 *  2. Trial expired → move to grace (7 days)
 *  3. Grace period expired → suspend + send email
 *  4. Active subscription period ended → move to grace
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentFailed, sendTrialEnding, sendSuspended } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const GRACE_DAYS = 7;

  const results = {
    trialReminders: 0,
    movedToGrace: 0,
    graceEmails: 0,
    suspended: 0,
    errors: 0,
  };

  // 1. Trial ending in ≤ 3 days — send reminder
  const trialEndingSoon = await prisma.subscription.findMany({
    where: {
      status: "trial",
      trialEndsAt: { lte: in3Days, gt: now },
      trialReminderSentAt: null,
    },
    include: {
      restaurant: {
        include: {
          users: { where: { role: "owner" }, select: { email: true }, take: 1 },
        },
      },
    },
  });

  for (const sub of trialEndingSoon) {
    try {
      const email = sub.restaurant.users[0]?.email;
      if (email && sub.trialEndsAt) {
        const daysLeft = Math.ceil((sub.trialEndsAt.getTime() - now.getTime()) / 86400000);
        await sendTrialEnding(email, sub.restaurant.name, daysLeft);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { trialReminderSentAt: now },
        });
        results.trialReminders++;
      }
    } catch {
      results.errors++;
    }
  }

  // 2. Trial expired — move to grace
  const trialExpired = await prisma.subscription.findMany({
    where: { status: "trial", trialEndsAt: { lte: now } },
    include: {
      restaurant: {
        include: {
          users: { where: { role: "owner" }, select: { email: true }, take: 1 },
        },
      },
    },
  });

  for (const sub of trialExpired) {
    try {
      const graceEnd = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "grace", gracePeriodEndsAt: graceEnd },
      });
      const email = sub.restaurant.users[0]?.email;
      if (email) {
        await sendPaymentFailed(email, sub.restaurant.name);
        results.graceEmails++;
      }
      results.movedToGrace++;
    } catch {
      results.errors++;
    }
  }

  // 3. Active subscription period ended — move to grace
  const activeExpired = await prisma.subscription.findMany({
    where: { status: "active", currentPeriodEnd: { lte: now } },
    include: {
      restaurant: {
        include: {
          users: { where: { role: "owner" }, select: { email: true }, take: 1 },
        },
      },
    },
  });

  for (const sub of activeExpired) {
    try {
      const graceEnd = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "grace", gracePeriodEndsAt: graceEnd },
      });
      const email = sub.restaurant.users[0]?.email;
      if (email) {
        await sendPaymentFailed(email, sub.restaurant.name);
        results.graceEmails++;
      }
      results.movedToGrace++;
    } catch {
      results.errors++;
    }
  }

  // 4. Grace period expired — suspend
  const graceExpired = await prisma.subscription.findMany({
    where: { status: "grace", gracePeriodEndsAt: { lte: now } },
    include: {
      restaurant: {
        include: {
          users: { where: { role: "owner" }, select: { email: true }, take: 1 },
        },
      },
    },
  });

  for (const sub of graceExpired) {
    try {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "suspended" },
      });
      const email = sub.restaurant.users[0]?.email;
      if (email) {
        await sendSuspended(email, sub.restaurant.name);
      }
      results.suspended++;
    } catch {
      results.errors++;
    }
  }

  console.log("[billing-check]", results);
  return NextResponse.json({ ok: true, ...results });
}
