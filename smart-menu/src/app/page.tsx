import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: "✍️",
    title: "Sign up and add your menu",
    desc: "Enter your restaurant name, add your dishes with prices, and your digital menu is ready. No technical skills needed — if you can type an SMS, you can do this.",
  },
  {
    number: "02",
    icon: "🖨️",
    title: "Print your QR code",
    desc: "Download the QR code we generate for you. Print it on paper, put it in a frame on each table, or stick it on the wall near the entrance. That's it.",
  },
  {
    number: "03",
    icon: "📲",
    title: "Customers scan and order",
    desc: "A customer opens their phone camera, points it at the QR code, and your menu opens instantly — no app download, no login. They tap a dish and see it in 3D.",
  },
];

const FEATURES = [
  {
    icon: "📋",
    title: "Always up to date",
    desc: "Change a price, remove a sold-out dish, or add a special — your menu updates instantly for every customer, even ones scanning right now.",
  },
  {
    icon: "🔮",
    title: "3D food preview (AR)",
    desc: "Customers tap a dish and see a 3D model appear right on their table through their phone screen. They know exactly what they're ordering.",
  },
  {
    icon: "📊",
    title: "See what's popular",
    desc: "Know which dishes are viewed most, when your busiest hours are, and how many people scanned your menu this week.",
  },
  {
    icon: "📍",
    title: "Multiple branches",
    desc: "Running more than one location? Each branch gets its own QR code and menu. Manage everything from one account.",
  },
  {
    icon: "💬",
    title: "Payment reminders via WhatsApp",
    desc: "We'll never surprise you with a sudden suspension. You'll get a WhatsApp reminder before your subscription renews.",
  },
  {
    icon: "🔒",
    title: "Your data, always safe",
    desc: "Even if you pause your subscription, your menu data is never deleted. Come back anytime and everything is exactly as you left it.",
  },
];

const PLANS = [
  {
    name: "Starter",
    swahili: "Bure",
    price: 0,
    period: "milele",
    highlight: false,
    badge: null,
    description: "For restaurants that want to try it before paying anything.",
    features: [
      { text: "Up to 10 menu items", ok: true },
      { text: "QR code for your menu", ok: true },
      { text: "Admin panel to manage items", ok: true },
      { text: "Mobile-friendly menu page", ok: true },
      { text: "3D / AR food viewer", ok: false },
      { text: "Image uploads", ok: false },
      { text: "Analytics dashboard", ok: false },
      { text: "Multiple branches", ok: false },
    ],
    cta: "Get started free",
    ctaHref: "/signup",
    ctaStyle: "border border-stone-600 text-white hover:border-amber-500 hover:text-amber-400",
  },
  {
    name: "Professional",
    swahili: "Kitaalamu",
    price: 50000,
    period: "kwa mwezi",
    highlight: true,
    badge: "Most popular",
    description: "For serious restaurants that want customers to see their food in 3D before ordering.",
    features: [
      { text: "Unlimited menu items", ok: true },
      { text: "QR code for your menu", ok: true },
      { text: "Admin panel to manage items", ok: true },
      { text: "Mobile-friendly menu page", ok: true },
      { text: "3D / AR food viewer", ok: true },
      { text: "Image uploads for all dishes", ok: true },
      { text: "Basic analytics (views, scans)", ok: true },
      { text: "Multiple branches", ok: false },
    ],
    cta: "Start 14-day free trial",
    ctaHref: "/signup?plan=professional",
    ctaStyle: "bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold shadow-lg shadow-amber-500/20",
  },
  {
    name: "Business",
    swahili: "Biashara",
    price: 120000,
    period: "kwa mwezi",
    highlight: false,
    badge: null,
    description: "For restaurants with multiple locations or those that want the full experience.",
    features: [
      { text: "Unlimited menu items", ok: true },
      { text: "QR code per branch", ok: true },
      { text: "Admin panel to manage items", ok: true },
      { text: "Mobile-friendly menu page", ok: true },
      { text: "3D / AR food viewer", ok: true },
      { text: "Image uploads for all dishes", ok: true },
      { text: "Advanced analytics", ok: true },
      { text: "Up to 5 branches / locations", ok: true },
    ],
    cta: "Start 14-day free trial",
    ctaHref: "/signup?plan=business",
    ctaStyle: "border border-stone-600 text-white hover:border-amber-500 hover:text-amber-400",
  },
];

const FAQS = [
  {
    q: "Je, wateja wangu wanahitaji kupakua programu? (Do customers need to download an app?)",
    a: "Hapana. No app needed. Customers open their phone camera, point it at the QR code, and your menu opens in the browser. Works on any Android or iPhone from the last 6 years.",
  },
  {
    q: "What if my internet is slow or the power goes out?",
    a: "Your menu page is hosted on our fast servers. As long as the customer has mobile data (even 3G), it loads. You don't need internet at your restaurant — only your customers do, to view the menu.",
  },
  {
    q: "Can I change prices or add new dishes anytime?",
    a: "Yes, instantly. Log in to your admin panel, make the change, and every customer who scans your QR code from that moment onwards sees the updated menu. No reprinting needed.",
  },
  {
    q: "How do I pay? Do you accept M-Pesa or Tigo Pesa?",
    a: "Yes. We accept M-Pesa, Tigo Pesa, Airtel Money, Halopesa, and Azampesa. All payments are in TZS — no dollars, no credit card needed.",
  },
  {
    q: "What happens if I don't pay on time?",
    a: "We'll send you a WhatsApp reminder 3 days before your due date. If payment is missed, you have a 7-day grace period before anything changes. Your menu data is never deleted.",
  },
  {
    q: "The 3D food models — how do I get them?",
    a: "Our team at Hima Tech creates or sources the 3D models for your dishes and adds them to your menu for you. You just tell us which dishes you want in 3D. It's included in Professional and Business plans.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur border-b border-stone-800/60">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-lg tracking-tight">Smart Menu</span>
            <span className="hidden sm:inline text-stone-500 text-xs ml-1">by Hima Tech</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="text-sm text-stone-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-sm px-5 py-2 rounded-full transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 tracking-wide">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
          Used by restaurants in Zanzibar &amp; Tanzania
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
          Give your restaurant a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
            digital menu
          </span>{" "}
          that wows customers
        </h1>

        <p className="mt-6 text-stone-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Customers scan a QR code on your table with their phone camera — no app download needed.
          They see your full menu instantly, tap any dish, and watch a{" "}
          <strong className="text-stone-200">3D model appear on their table</strong> through their screen.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-8 py-4 rounded-full transition-colors shadow-lg shadow-amber-500/20 text-base"
          >
            Start free — no credit card
          </Link>
          <Link
            href="/menu/zanzibar-pizza"
            className="border border-stone-700 hover:border-stone-500 text-stone-300 hover:text-white font-medium px-8 py-4 rounded-full transition-colors text-base"
            target="_blank"
          >
            See a live demo menu →
          </Link>
        </div>

        <p className="mt-5 text-stone-600 text-sm">
          14-day free trial · Pay with M-Pesa, Tigo Pesa, Airtel · TZS pricing
        </p>
      </section>

      {/* ── How it works ── */}
      <section className="bg-stone-900/50 border-y border-stone-800/50 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Up and running in under 5 minutes</h2>
            <p className="text-stone-400 mt-3 max-w-xl mx-auto">
              You don&apos;t need to know anything about technology. If you can type an SMS message, you can set up Smart Menu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-amber-500/60 text-xs font-mono font-bold mb-1">{step.number}</p>
                    <h3 className="font-bold text-white text-lg leading-snug mb-2">{step.title}</h3>
                    <p className="text-stone-400 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="text-center mb-14">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Everything included</p>
          <h2 className="text-3xl sm:text-4xl font-bold">Built for real restaurants, not tech companies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 hover:border-stone-700 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
              <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-stone-900/50 border-y border-stone-800/50 py-20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-14">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-bold">Simple, honest pricing in TZS</h2>
            <p className="text-stone-400 mt-3 max-w-lg mx-auto">
              Start free. Upgrade when you&apos;re ready. Pay with mobile money — no credit card ever required.
              Annual plans save you 20%.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  plan.highlight
                    ? "bg-gradient-to-b from-amber-500/10 to-stone-900 border-2 border-amber-500/50"
                    : "bg-stone-900/60 border border-stone-800"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <span className="text-stone-500 text-xs">{plan.swahili}</span>
                  </div>
                  <div className="flex items-end gap-1.5 mb-3">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-extrabold text-white">Bure</span>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-white">
                          {plan.price.toLocaleString()}
                        </span>
                        <span className="text-stone-400 text-sm mb-1">TZS {plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-stone-400 text-sm leading-relaxed">{plan.description}</p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5 text-sm">
                      <span className={`mt-0.5 shrink-0 ${f.ok ? "text-amber-400" : "text-stone-700"}`}>
                        {f.ok ? "✓" : "✗"}
                      </span>
                      <span className={f.ok ? "text-stone-300" : "text-stone-600"}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.ctaHref}
                  className={`block text-center py-3 rounded-xl text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-stone-500 text-sm mt-8">
            All paid plans include a <strong className="text-stone-400">14-day free trial</strong>.
            Cancel anytime. Your data is always yours.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
          <h2 className="text-3xl font-bold">Questions restaurant owners ask us</h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.q}
              className="group bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden"
            >
              <summary className="cursor-pointer px-6 py-4 font-medium text-stone-200 text-sm flex items-center justify-between gap-4 select-none list-none">
                <span>{faq.q}</span>
                <span className="shrink-0 text-stone-500 group-open:rotate-180 transition-transform text-lg">⌄</span>
              </summary>
              <p className="px-6 pb-5 text-stone-400 text-sm leading-relaxed border-t border-stone-800/50 pt-4">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-b from-stone-900 to-stone-950 border-t border-stone-800/50 py-20 text-center px-5">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
          Ready to give your restaurant a modern menu?
        </h2>
        <p className="text-stone-400 max-w-md mx-auto mb-8 leading-relaxed">
          Sign up in 2 minutes. Add your dishes. Download your QR code.
          Your customers will be impressed from day one.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-10 py-4 rounded-full text-base transition-colors shadow-xl shadow-amber-500/20"
        >
          Get started — it&apos;s free
        </Link>
        <p className="mt-4 text-stone-600 text-sm">No credit card · Pay with mobile money · Cancel anytime</p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-800/50 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-600 text-sm">
          <div className="flex items-center gap-2">
            <span>🍽️</span>
            <span className="font-semibold text-stone-400">Smart Menu</span>
            <span>· Built by Hima Tech, Zanzibar</span>
          </div>
          <div className="flex gap-6">
            <Link href="/admin/login" className="hover:text-stone-400 transition-colors">Restaurant Login</Link>
            <Link href="#pricing" className="hover:text-stone-400 transition-colors">Pricing</Link>
            <Link href="/menu/zanzibar-pizza" className="hover:text-stone-400 transition-colors">Demo</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
