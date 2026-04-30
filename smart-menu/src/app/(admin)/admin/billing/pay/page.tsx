"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const PROVIDERS = [
  { label: "M-Pesa (Vodacom)", prefix: "074/075/076" },
  { label: "Tigo Pesa", prefix: "067/068" },
  { label: "Airtel Money", prefix: "078/079" },
  { label: "Halopesa", prefix: "062" },
];

export default function PayPage() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId") ?? "";
  const planName = params.get("planName") ?? "Professional";
  const price = params.get("price") ?? "50000";

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "waiting" | "done">("form");

  async function handlePay() {
    setError(null);
    if (!phone.trim() || phone.trim().length < 9) {
      setError("Please enter a valid phone number (at least 9 digits)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, phone: phone.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Payment failed. Please try again.");
        setLoading(false);
        return;
      }

      setStep("waiting");
      setLoading(false);
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  if (step === "waiting") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-5">
        <div className="text-5xl animate-pulse">📱</div>
        <h1 className="text-xl font-bold text-stone-900">Check your phone</h1>
        <p className="text-stone-500 text-sm max-w-xs">
          A payment prompt has been sent to <strong>{phone}</strong>. Enter your PIN to
          confirm <strong>TZS {Number(price).toLocaleString()}</strong>.
        </p>
        <div className="w-full max-w-xs space-y-3 pt-2">
          <p className="text-xs text-stone-400">Your subscription activates within 1 minute of payment confirmation.</p>
          <button
            onClick={() => router.push("/admin/billing")}
            className="w-full border border-stone-200 text-stone-600 text-sm py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
          >
            ← Back to billing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Pay now</h1>
        <p className="text-stone-500 text-sm mt-1">
          Upgrading to <strong>{planName}</strong> — TZS {Number(price).toLocaleString()}/month
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-stone-700 mb-1.5">
            Mobile money number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712 345 678"
            className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>

        <div className="bg-stone-50 rounded-xl p-3 space-y-1">
          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Supported networks</p>
          {PROVIDERS.map((p) => (
            <div key={p.label} className="flex items-center justify-between text-xs text-stone-600">
              <span>{p.label}</span>
              <span className="text-stone-400 font-mono">{p.prefix}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          id="pay-now-btn"
          onClick={handlePay}
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-stone-900 font-bold text-sm py-3 rounded-xl transition-colors"
        >
          {loading ? "Sending payment request…" : `Pay TZS ${Number(price).toLocaleString()} →`}
        </button>

        <p className="text-[11px] text-stone-400 text-center">
          Payments secured by Azampay. TZS only.
        </p>
      </div>

      <button
        onClick={() => router.back()}
        className="w-full text-sm text-stone-400 hover:text-stone-600 text-center"
      >
        ← Cancel
      </button>
    </div>
  );
}
