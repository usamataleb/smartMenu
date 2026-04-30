"use client";

import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  // Redirect already-authenticated users immediately
  useEffect(() => {
    getSession().then((session) => {
      if (!session) { setChecking(false); return; }
      const role = (session.user as { role?: string })?.role;
      router.replace(role === "superadmin" ? "/superadmin" : "/admin");
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;
    router.push(role === "superadmin" ? "/superadmin" : "/admin");
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">🍽️</span>
            <span className="font-bold text-xl">Smart Menu</span>
          </Link>
          <p className="text-stone-400 text-sm mt-2">Sign in to manage your restaurant</p>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-7">
          <h1 className="text-xl font-bold text-white mb-6">Sign in</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-stone-700 bg-stone-800 text-white rounded-xl px-3 py-3 text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="owner@restaurant.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-stone-700 bg-stone-800 text-white rounded-xl px-3 py-3 text-sm placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-3 rounded-xl transition-colors text-sm mt-1"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-stone-500 text-xs mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-amber-400 hover:text-amber-300">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
