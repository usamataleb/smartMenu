"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const INPUT = "w-full border border-stone-200 rounded-xl px-3 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";

function SignupForm() {
  const params = useSearchParams();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({
    restaurantName: "",
    email: "",
    phone: "",
    password: "",
    address: "",
  });

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/restaurants/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign in after registration
    await signIn("credentials", {
      email: fields.email,
      password: fields.password,
      redirect: true,
      callbackUrl: "/onboarding",
    });
  }

  const planLabel = params.get("plan") === "business" ? "Business" : params.get("plan") === "professional" ? "Professional" : "Starter (Free)";

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">🍽️</span>
            <span className="font-bold text-xl">Smart Menu</span>
          </Link>
          <p className="text-stone-400 text-sm mt-2">Create your restaurant account</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-7">
          {/* Plan badge */}
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span>✓</span> Selected plan: {planLabel}
          </div>

          <h1 className="text-xl font-bold text-white mb-6">Sign up — 14-day free trial</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Restaurant name *</label>
              <input value={fields.restaurantName} onChange={set("restaurantName")} placeholder="e.g. Zanzibar Pizza House" required className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Email *</label>
                <input type="email" value={fields.email} onChange={set("email")} placeholder="you@example.com" required className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Phone *</label>
                <input type="tel" value={fields.phone} onChange={set("phone")} placeholder="+255 7XX XXX XXX" required className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Address</label>
              <input value={fields.address} onChange={set("address")} placeholder="Street, City" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Password *</label>
              <input type="password" value={fields.password} onChange={set("password")} placeholder="Min 6 characters" required minLength={6} className={INPUT} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm mt-2"
            >
              {loading ? "Creating your account…" : "Create account & get QR code"}
            </button>
          </form>

          <p className="text-center text-stone-500 text-xs mt-5">
            Already have an account?{" "}
            <Link href="/admin/login" className="text-amber-400 hover:text-amber-300">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-stone-600 text-xs mt-6">
          By signing up you agree to our terms. No credit card required.
          Pay with M-Pesa, Tigo Pesa, Airtel after your trial.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
