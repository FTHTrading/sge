import Link from "next/link";
import {
  Zap,
  Shield,
  Globe2,
  Activity,
  ChevronRight,
  BarChart3,
  Lock,
  Layers,
} from "lucide-react";

const stats = [
  { label: "Countries", value: "47", icon: Globe2 },
  { label: "MW Deployed", value: "2,400+", icon: Zap },
  { label: "Partners", value: "180+", icon: Activity },
  { label: "Standards", value: "24", icon: Shield },
];

const pillars = [
  {
    icon: Layers,
    title: "AI-Driven Energy Optimization",
    description:
      "Patent-pending algorithms that optimize renewable energy production, storage, and distribution across global deployments in real time.",
  },
  {
    icon: Lock,
    title: "Immutable Audit Infrastructure",
    description:
      "Hash-chained audit events with cryptographic proofs ensure every milestone, certification, and governance action is permanently verifiable.",
  },
  {
    icon: Shield,
    title: "Standards & Certification",
    description:
      "Define, publish, and certify compliance against evolving sustainability standards. Automated evidence collection with third-party attestation.",
  },
  {
    icon: BarChart3,
    title: "Transparent Governance",
    description:
      "Proposal-driven governance with weighted voting, quorum enforcement, and resolution tracking. Every decision is auditable and on-chain anchored.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-32 lg:py-44">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.03] blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">
              Open-Access Climate Infrastructure
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Scalable{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              Green Energy
            </span>{" "}
            Alignment OS
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            The enterprise platform powering transparent governance, standards
            certification, and AI-optimized energy infrastructure across 47
            countries.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/activate"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25"
            >
              Activate Your Position
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/ecosystem"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/[0.04] transition-colors"
            >
              Explore Ecosystem
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-5 w-5 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Infrastructure Pillars
            </h2>
            <p className="mt-4 text-lg text-white/40 max-w-xl mx-auto">
              Four integrated systems that power the SGE Alignment OS platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-5">
                  <pillar.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Foundation Activation CTA */}
      <section className="py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-emerald-600/5 to-transparent p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/[0.04] blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-400">
                  Foundation Positions Open
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Secure Your Foundational Position
              </h2>
              <p className="mt-4 text-lg text-white/50 max-w-xl mx-auto">
                Complete your one-time foundation contribution and receive
                1,000 SGE Tokens instantly upon activation, plus 100 SGE monthly for 12 months.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/activate"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/25"
                >
                  Activate Now
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3.5 text-sm font-semibold text-white/80 hover:bg-white/[0.04] transition-colors"
                >
                  Become a Partner
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
