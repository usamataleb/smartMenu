/**
 * Email notifications via Resend (https://resend.com)
 * Free tier: 3,000 emails/month, 100/day
 *
 * Set RESEND_API_KEY in .env.local
 * Set RESEND_FROM_EMAIL e.g. "Smart Menu <noreply@himatech.co.tz>"
 */

import { Resend } from "resend";

// Provide a dummy key if env var is missing during build time
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");
const FROM = process.env.RESEND_FROM_EMAIL ?? "Smart Menu <noreply@himatech.co.tz>";
const APP_URL = process.env.NEXTAUTH_URL ?? "https://smartmenu.himatech.co.tz";

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return;
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Failed to send:", subject, err);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendWelcome(email: string, restaurantName: string) {
  await send(
    email,
    `Welcome to Smart Menu, ${restaurantName}! 🎉`,
    `
    <p>Hi there,</p>
    <p>Welcome to <strong>Smart Menu</strong>! Your restaurant <strong>${restaurantName}</strong> is now live on the platform.</p>
    <p>You have a <strong>14-day free trial</strong> — no credit card required.</p>
    <p>
      <a href="${APP_URL}/admin" style="background:#f59e0b;color:#1c1917;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Set up your menu →
      </a>
    </p>
    <p>Questions? Reply to this email or WhatsApp us at <strong>+255 XXX XXX XXX</strong>.</p>
    <p>— Hima Tech Team</p>
    `
  );
}

export async function sendTrialEnding(email: string, restaurantName: string, daysLeft: number) {
  await send(
    email,
    `⚠️ Your Smart Menu trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
    `
    <p>Hi ${restaurantName},</p>
    <p>Your free trial expires in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong>.</p>
    <p>To keep your menu live and visible to customers, please upgrade your plan.</p>
    <p>
      <a href="${APP_URL}/admin/billing" style="background:#f59e0b;color:#1c1917;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Upgrade now →
      </a>
    </p>
    <p>Plans start at <strong>TZS 50,000/month</strong>. Pay via M-Pesa, Tigo Pesa, or Airtel Money.</p>
    <p>— Hima Tech Team</p>
    `
  );
}

export async function sendPaymentConfirmed(email: string, amountTZS: number, period: string) {
  await send(
    email,
    `✅ Payment confirmed — Smart Menu ${period}`,
    `
    <p>Your payment of <strong>TZS ${amountTZS.toLocaleString()}</strong> for <strong>${period}</strong> has been received.</p>
    <p>Your subscription is now active. Your menu is live!</p>
    <p>
      <a href="${APP_URL}/admin" style="background:#f59e0b;color:#1c1917;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Go to dashboard →
      </a>
    </p>
    <p>— Hima Tech Team</p>
    `
  );
}

export async function sendPaymentFailed(email: string, restaurantName: string) {
  await send(
    email,
    `❌ Payment failed — Action required`,
    `
    <p>Hi ${restaurantName},</p>
    <p>We were unable to process your Smart Menu payment.</p>
    <p>Please try again from your billing page to keep your menu online.</p>
    <p>
      <a href="${APP_URL}/admin/billing" style="background:#f59e0b;color:#1c1917;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Retry payment →
      </a>
    </p>
    <p>— Hima Tech Team</p>
    `
  );
}

export async function sendSuspended(email: string, restaurantName: string) {
  await send(
    email,
    `⛔ Your Smart Menu has been suspended`,
    `
    <p>Hi ${restaurantName},</p>
    <p>Your Smart Menu account has been <strong>suspended</strong> due to an unpaid subscription.</p>
    <p>Your menu is currently hidden from customers. Pay now to reactivate immediately.</p>
    <p>
      <a href="${APP_URL}/admin/billing" style="background:#ef4444;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Reactivate now →
      </a>
    </p>
    <p>Your data is safe and will not be deleted.</p>
    <p>— Hima Tech Team</p>
    `
  );
}

export async function sendReactivated(email: string, restaurantName: string) {
  await send(
    email,
    `🎉 Your Smart Menu is back online!`,
    `
    <p>Hi ${restaurantName},</p>
    <p>Great news — your Smart Menu subscription has been reactivated!</p>
    <p>Your menu is now live and visible to customers again.</p>
    <p>
      <a href="${APP_URL}/admin" style="background:#f59e0b;color:#1c1917;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Go to dashboard →
      </a>
    </p>
    <p>— Hima Tech Team</p>
    `
  );
}
