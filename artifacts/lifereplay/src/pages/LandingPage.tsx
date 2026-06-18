import { Link } from "wouter";
import { Sparkles, Search, LayoutDashboard, Clock3, Film, Users, LineChart, CheckCircle2 } from "lucide-react";

const FEATURE_PREVIEWS = [
  { title: "AI Memory Search", description: "Ask naturally and retrieve grounded memories only.", icon: Search },
  { title: "Dashboard Preview", description: "A premium command center for your life moments.", icon: LayoutDashboard },
  { title: "Timeline Preview", description: "Revisit your life year-by-year with smooth flow.", icon: Clock3 },
  { title: "Replay Video Preview", description: "Generate cinematic highlights from memories.", icon: Film },
  { title: "Family Sharing", description: "Share archives with role-based controls.", icon: Users },
  { title: "AI Insights", description: "Track mood patterns, peaks, and reflections.", icon: LineChart },
];

const PRICING = [
  { name: "Free", price: "₹0/month", points: ["100 memories", "1 GB storage", "Basic AI", "Basic search"] },
  { name: "Premium", price: "₹199/month • ₹1,999/year", points: ["Unlimited memories", "Unlimited AI chat", "Semantic AI search", "Replay videos"] },
  { name: "Family", price: "₹499/month • ₹4,999/year", points: ["Everything in Premium", "Up to 6 members", "Shared archive + AI", "Shared replay videos"] },
];

const FAQ = [
  { q: "Does AI invent memories?", a: "No. LifeReplay only answers from your stored memories." },
  { q: "Can I keep memories private?", a: "Yes. Private memories stay private even in family spaces." },
  { q: "Is Supabase still supported?", a: "Yes. LifeReplay remains fully compatible with Supabase." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070707] text-white">
      <header className="border-b border-amber-500/20 bg-black/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles size={16} />
            <span className="font-serif text-lg">LifeReplay</span>
          </div>
          <Link href="/" className="text-sm text-amber-300 hover:text-amber-200">Sign in</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <p className="text-amber-400 text-xs tracking-[0.2em] uppercase mb-6">LifeReplay v3</p>
        <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-tight">
          An AI that remembers your life — so you don't have to.
        </h1>
        <p className="mt-6 text-zinc-300 max-w-2xl mx-auto">
          Premium memory intelligence for stories, search, timelines, replays, and legacy.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/?intent=waitlist"
            className="px-6 py-3 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            Join Waitlist
          </Link>
          <Link
            href="/"
            className="px-6 py-3 rounded-xl border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
          >
            Try Demo
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURE_PREVIEWS.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-2xl border border-amber-500/20 bg-zinc-950 p-5">
            <Icon size={18} className="text-amber-400" />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="text-sm text-zinc-400 mt-1">{description}</p>
          </article>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="font-serif text-2xl mb-4">Testimonials</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            "It feels like Apple Photos with emotional AI memory recall.",
            "My entire family archive now feels alive and searchable.",
            "The replay videos turned yearly memories into stories.",
          ].map((quote) => (
            <blockquote key={quote} className="rounded-2xl border border-amber-500/20 bg-zinc-950 p-5 text-zinc-300 text-sm">
              “{quote}”
            </blockquote>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-14">
        <h2 className="font-serif text-2xl mb-4">Pricing (INR)</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PRICING.map((plan) => (
            <article key={plan.name} className="rounded-2xl border border-amber-500/20 bg-zinc-950 p-5">
              <h3 className="font-semibold">{plan.name}</h3>
              <p className="text-amber-300 mt-1">{plan.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {plan.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-amber-400 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="font-serif text-2xl mb-4">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border border-amber-500/20 bg-zinc-950 p-4">
              <p className="font-medium">{item.q}</p>
              <p className="text-sm text-zinc-400 mt-1">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-amber-500/20 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} LifeReplay • Preserve your digital legacy.
      </footer>
    </div>
  );
}
