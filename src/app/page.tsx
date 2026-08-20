"use client";

import Link from "next/link";
import LandingNav from "@/components/LandingNav";
import {
  ArrowRight,
  Ticket,
  BarChart3,
  Users,
  Star,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

/* ── updated dashboard preview matching screenshot-1 ── */
function DashboardPreview() {
  const events = [
    {
      name: "Neon Mirage",
      sold: 112,
      cap: 150,
      pct: 74,
      img: "photo-1514525253161-7a46d19cd819",
    },
    {
      name: "Lagos Vibes X",
      sold: 340,
      cap: 400,
      pct: 85,
      img: "photo-1492684223066-81342ee5ff30",
    },
    { name: "Decked Night", sold: 0, cap: 80, pct: 0, img: "" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-[#0a0a0c] border border-white/5 p-6 md:p-10 shadow-2xl shadow-black/80">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl bg-[#111113] border border-white/5 p-5">
          <div className="font-heading text-3xl font-black text-[#a78bfa] mb-1 tracking-tight">
            ₦ 4.2M
          </div>
          <div className="text-xs font-bold text-emerald-400">+22%</div>
        </div>
        <div className="rounded-2xl bg-[#111113] border border-white/5 p-5">
          <div className="font-heading text-3xl font-black text-white mb-1 tracking-tight">
            847
          </div>
          <div className="text-xs font-bold text-emerald-400">+18%</div>
        </div>
        <div className="rounded-2xl bg-[#111113] border border-white/5 p-5">
          <div className="font-heading text-3xl font-black text-emerald-400 mb-1 tracking-tight">
            ₦ 2.8M
          </div>
          <div className="text-xs font-bold text-white/30">06:00 AM</div>
        </div>
      </div>

      {/* Events List */}
      <div className="rounded-3xl bg-[#111113] border border-white/5 p-6">
        <div className="text-[11px] font-bold text-white/40 tracking-wider mb-6">
          MY EVENTS
        </div>

        <div className="flex flex-col gap-4">
          {events.map((ev, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl bg-[#151518] border border-white/5 p-4"
            >
              <div
                className="h-12 w-12 rounded-full bg-white/10 shrink-0 bg-cover bg-center"
                style={
                  ev.img
                    ? {
                        backgroundImage: `url('https://images.unsplash.com/${ev.img}?q=80&w=150')`,
                      }
                    : undefined
                }
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white text-sm truncate">
                    {ev.name}
                  </span>
                  <span className="text-[11px] text-white/40 font-medium shrink-0">
                    {ev.sold}/{ev.cap}
                  </span>
                </div>
                {/* Progress bar matching the screenshot */}
                <div className="h-1.5 w-full bg-[#1e1e24] rounded-full overflow-hidden">
                  {ev.pct > 0 && (
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${ev.pct}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── discovery showcase section: Bhind events surface on TheScene ── */
function DiscoverSection() {
  const flyers = [
    {
      name: "Squirt N Splash",
      date: "Mar 22 – 23, 7PM",
      img: "squirtNsplash.jpeg",
      rotate: "-rotate-6",
      hoverRotate: "hover:-rotate-2",
    },
    {
      name: "Opening Statement",
      date: "sept 5 · 5:00 PM",
      img: "/opening-statement.jpeg",
      rotate: "rotate-3",
      hoverRotate: "hover:rotate-1",
    },
  ];

  return (
    <section className="relative py-28 bg-[#050505] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-violet-900/10 rounded-full blur-[130px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* ── copy ── */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-300/80 mb-8 backdrop-blur-md">
            Synced with TheScene
          </div>

          <h2 className="font-heading text-4xl md:text-5xl font-black leading-tight tracking-tight text-white mb-6">
            List it once.{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">
              Get discovered everywhere.
            </span>
          </h2>

          <p className="text-white/50 text-base md:text-lg leading-relaxed mb-10 max-w-md">
            Every event you create on Bhind is pushed straight to TheScene's
            discovery feed, so your audience finds it without you lifting a
            finger.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-heading text-base font-bold text-black hover:scale-105 transition-transform"
            >
              List Your First Event
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-white/40">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              No extra setup on TheScene
            </div>
          </div>
        </div>

        {/* ── floating mockup composition ── */}
        <div className="relative h-[600px] flex items-center justify-center">
          {/* flyer card ahead, left */}
          <div
            className={`group absolute left-0 top-8 w-60 z-30 ${flyers[0].rotate} ${flyers[0].hoverRotate} hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out rounded-[1.75rem] bg-[#111113] border border-white/10 p-2 shadow-2xl shadow-black/60 hover:shadow-violet-500/20 cursor-pointer`}
          >
            <div
              className="h-52 w-full rounded-[1.4rem] bg-cover bg-center bg-white/10 overflow-hidden relative"
              style={{
                backgroundImage: `url('${flyers[0].img}')`,
              }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            <div className="px-2 pt-3 pb-2">
              <div className="text-xs font-bold text-white truncate">
                {flyers[0].name}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {flyers[0].date}
              </div>
            </div>
          </div>

          {/* flyer card ahead, right */}
          <div
            className={`group absolute right-0 bottom-10 w-60 z-30 ${flyers[1].rotate} ${flyers[1].hoverRotate} hover:-translate-y-2 hover:scale-105 transition-all duration-300 ease-out rounded-[1.75rem] bg-[#111113] border border-white/10 p-2 shadow-2xl shadow-black/60 hover:shadow-violet-500/20 cursor-pointer`}
          >
            <div
              className="h-44 w-full rounded-[1.2rem] bg-cover bg-center bg-white/10 overflow-hidden relative"
              style={{
                backgroundImage: `url('${flyers[1].img}')`,
              }}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>
            <div className="px-2 pt-3 pb-2">
              <div className="text-xs font-bold text-white truncate">
                {flyers[1].name}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5">
                {flyers[1].date}
              </div>
            </div>
          </div>

          {/* real phone mockup, centered, on top */}
          <div className="group relative z-10 hover:z-40 w-[260px] hover:-translate-y-3 transition-transform duration-300 ease-out">
            {/* outer frame */}
            <div className="relative rounded-[3rem] bg-gradient-to-b from-[#2a2a2e] to-[#0a0a0c] p-[3px] shadow-2xl shadow-black/80 group-hover:shadow-violet-500/25 transition-shadow duration-300">
              <div className="rounded-[2.85rem] bg-black p-2">
                {/* side buttons */}
                <div className="absolute -left-[3px] top-24 w-[3px] h-8 rounded-l bg-[#2a2a2e]" />
                <div className="absolute -left-[3px] top-36 w-[3px] h-12 rounded-l bg-[#2a2a2e]" />
                <div className="absolute -right-[3px] top-32 w-[3px] h-16 rounded-r bg-[#2a2a2e]" />

                {/* screen */}
                <div className="relative rounded-[2.4rem] overflow-hidden bg-black aspect-[9/19.5]">
                  {/* dynamic island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full bg-black z-20" />

                  {/* ── your full screenshot goes here ── */}
                  <img
                    src="/IMG_4070.png"
                    alt="TheScene app screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* floating "synced" chip */}
          <div className="absolute top-2 right-8 z-20 flex items-center gap-1.5 rounded-full bg-[#111113] border border-white/10 px-3 py-1.5 text-[11px] font-semibold text-white/70 shadow-xl hover:-translate-y-1 hover:shadow-violet-500/20 transition-all duration-300 cursor-default">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Synced automatically
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090A] text-[#F9FAFB] font-body selection:bg-violet-500/30 overflow-x-hidden">
      <LandingNav />

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center pt-48 pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[500px] bg-violet-900/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs font-semibold text-violet-300/80 mb-8 backdrop-blur-md">
            Powered by TheScene
          </div>

          <h1 className="font-heading text-4xl md:text-6xl font-black leading-tight tracking-tight mb-6">
            The right way to{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent">
              manage events.
            </span>
          </h1>

          <p className="max-w-xl text-base md:text-lg text-white/50 leading-relaxed mb-10">
            Sell tickets, track revenue, manage guest lists, and broadcast to
            your audience, seamlessly integrated with TheScene.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
            <Link
              href="/auth/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 font-heading text-base font-bold text-black hover:scale-105 transition-transform"
            >
              Start for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 py-4 font-heading text-base font-bold text-white hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="w-full px-4">
          <DashboardPreview />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 bg-[#050505] mt-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="font-heading text-4xl md:text-5xl font-black text-white leading-none tracking-tight max-w-xl">
                Engineered for the scene.
              </h2>
            </div>
            <p className="text-white/40 text-base max-w-sm">
              Powerful tools designed specifically for nightlife and large-scale
              event organisers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <Ticket className="h-7 w-7" />,
                title: "Ticketing & Tiers",
                desc: "Create General, VIP, and VVIP tiers with instant checkout on TheScene.",
              },
              {
                icon: <BarChart3 className="h-7 w-7" />,
                title: "Daily Payouts",
                desc: "Automated settlements direct to your bank account.",
              },
              {
                icon: <Users className="h-7 w-7" />,
                title: "Guest List",
                desc: "Live check-in roster synced with the TheScene mobile scanner.",
              },
              {
                icon: <Star className="h-7 w-7" />,
                title: "VIP Concierge",
                desc: "Personalised invites and table assignments for your top guests.",
              },
              {
                icon: <Mail className="h-7 w-7" />,
                title: "Email Broadcast",
                desc: "Send instant updates to every ticket holder with one click.",
              },
              {
                icon: <ShieldCheck className="h-7 w-7" />,
                title: "Door Staff Control",
                desc: "Authorise bouncers securely from their phones via TheScene.",
              },
            ].map((feat, i) => (
              <div
                key={i}
                className="rounded-[2rem] p-8 border border-white/5 bg-[#111113]"
              >
                <div className="h-12 w-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-6">
                  {feat.icon}
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DiscoverSection />

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 bg-black py-14">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-brand text-xl text-white tracking-widest">
              Bhind.
            </span>
            <span className="text-white/20 text-xs">Powered by TheScene</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition">
              Contact
            </a>
          </div>

          <div className="text-xs text-white/20">
            © {new Date().getFullYear()} TheScene. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
