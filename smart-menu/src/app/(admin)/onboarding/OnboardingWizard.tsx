"use client";

import { useActionState, useState } from "react";
import { updateOnboardingProfile, createFirstMenuItem, completeOnboarding } from "./actions";

const INPUT = "w-full border border-stone-200 rounded-xl px-3 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white";

const STEPS = [
  { n: 1, label: "Your restaurant" },
  { n: 2, label: "First dish" },
  { n: 3, label: "Your QR code" },
];

interface Props {
  restaurantName: string;
  restaurantAddress: string | null;
  restaurantPhone: string | null;
  menuUrl: string;
  qrDataUrl: string;
  slug: string;
}

export default function OnboardingWizard({
  restaurantName,
  restaurantAddress,
  restaurantPhone,
  menuUrl,
  qrDataUrl,
  slug,
}: Props) {
  const [step, setStep] = useState(1);

  const [profileState, profileAction, profilePending] = useActionState(updateOnboardingProfile, null);
  const [itemState, itemAction, itemPending] = useActionState(createFirstMenuItem, null);

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await updateOnboardingProfile(null, fd);
    if (!result?.error) setStep(2);
  }

  async function handleItemSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const result = await createFirstMenuItem(null, fd);
    if (!result?.error) setStep(3);
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">🍽️</span>
            <span className="font-bold text-xl">Smart Menu</span>
          </div>
          <p className="text-stone-400 text-sm mt-1">Let&apos;s get you set up in 3 steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > s.n
                      ? "bg-green-500 text-white"
                      : step === s.n
                      ? "bg-amber-500 text-stone-900"
                      : "bg-stone-800 text-stone-500"
                  }`}
                >
                  {step > s.n ? "✓" : s.n}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    step === s.n ? "text-white font-medium" : "text-stone-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${step > s.n ? "bg-green-500" : "bg-stone-700"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-7">

          {/* ── Step 1: Restaurant details ── */}
          {step === 1 && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Confirm your restaurant details</h2>
                <p className="text-stone-400 text-sm mt-1">These appear on your public menu page.</p>
              </div>

              {profileState?.error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {profileState.error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Restaurant name *</label>
                <input name="name" defaultValue={restaurantName} required className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Address</label>
                <input name="address" defaultValue={restaurantAddress ?? ""} placeholder="Street, City" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Phone</label>
                <input name="phone" defaultValue={restaurantPhone ?? ""} placeholder="+255 7XX XXX XXX" className={INPUT} />
              </div>

              <button
                type="submit"
                disabled={profilePending}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm"
              >
                {profilePending ? "Saving…" : "Continue →"}
              </button>
            </form>
          )}

          {/* ── Step 2: First menu item ── */}
          {step === 2 && (
            <form onSubmit={handleItemSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Add your first dish</h2>
                <p className="text-stone-400 text-sm mt-1">You can add more dishes later — just start with one.</p>
              </div>

              {itemState?.error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                  {itemState.error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1.5">Dish name *</label>
                <input name="name" placeholder="e.g. Grilled Chicken" required className={INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Price (TZS) *</label>
                  <input name="price" type="number" min="0" step="500" placeholder="e.g. 12000" required className={INPUT} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1.5">Category *</label>
                  <input name="category" placeholder="e.g. Main Course" required list="cats" className={INPUT} />
                  <datalist id="cats">
                    <option value="Starters" />
                    <option value="Main Course" />
                    <option value="Seafood" />
                    <option value="Grills" />
                    <option value="Rice Dishes" />
                    <option value="Pasta" />
                    <option value="Salads" />
                    <option value="Soups" />
                    <option value="Desserts" />
                    <option value="Drinks" />
                    <option value="Street Food" />
                  </datalist>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 border border-stone-700 text-stone-400 rounded-xl text-sm hover:bg-stone-800 transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={itemPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  {itemPending ? "Adding dish…" : "Add dish & continue →"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: QR code ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-xl font-bold text-white">You&apos;re all set!</h2>
                <p className="text-stone-400 text-sm mt-1">
                  Your menu is live at{" "}
                  <a href={menuUrl} target="_blank" className="text-amber-400 hover:underline font-mono text-xs">
                    {menuUrl}
                  </a>
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 flex flex-col items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrDataUrl} alt="Your QR code" className="w-44 h-44 rounded-xl" />
                <div className="text-center">
                  <p className="font-semibold text-stone-800 text-sm">Print &amp; place on your tables</p>
                  <p className="text-xs text-stone-400 mt-1">Customers scan this to open your menu instantly</p>
                </div>
                <a
                  href={qrDataUrl}
                  download={`${slug}-qr.png`}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-5 py-3 rounded-xl transition-colors text-center block"
                >
                  Download QR code (PNG)
                </a>
              </div>

              <form action={completeOnboarding}>
                <button
                  type="submit"
                  className="w-full border border-stone-700 hover:bg-stone-800 text-stone-300 font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Go to my dashboard →
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
