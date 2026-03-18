import { Globe, GitBranch, Scale, Users, BookOpen, ArrowRight, ExternalLink, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";

const principles = [
  {
    icon: Globe,
    title: "Open by Default",
    description: "All core standards, governance documents, and technical specifications are published under open licenses. No proprietary lock-in.",
  },
  {
    icon: GitBranch,
    title: "Community-Led Evolution",
    description: "Any registered entity can submit improvement proposals. Changes are decided by weighted governance vote — not by the Foundation alone.",
  },
  {
    icon: Scale,
    title: "Accountable Governance",
    description: "Every governance decision is recorded on-chain with immutable timestamps, voter records, and outcome hashes. Full audit trail, always.",
  },
  {
    icon: Users,
    title: "Multi-Stakeholder Input",
    description: "Framework committees include partners, researchers, certifiers, and public-sector observers — no single actor can dominate the process.",
  },
  {
    icon: BookOpen,
    title: "Machine-Readable Standards",
    description: "All standards are published as versioned JSON schemas, enabling automated compliance checking and third-party tooling integration.",
  },
  {
    icon: CheckCircle,
    title: "Transparent Certification",
    description: "Certification decisions, reviewer identities, and evidence summaries are publicly visible. Trust through radical transparency.",
  },
];

const components = [
  {
    version: "v2.1",
    name: "SGE Standards Corpus",
    description: "42 published standards covering deployment, emissions, reporting, and partner conduct. Machine-readable JSON schemas for each.",
    status: "Active",
    link: "/standards-public",
  },
  {
    version: "v1.8",
    name: "Governance Protocol",
    description: "On-chain proposal and voting system with quorum requirements, veto thresholds, and appeal mechanisms.",
    status: "Active",
    link: "/governance-public",
  },
  {
    version: "v1.4",
    name: "Certification Framework",
    description: "Multi-tier certification scheme with defined evidence requirements, reviewer qualification standards, and appeals process.",
    status: "Active",
    link: "/certification-public",
  },
  {
    version: "v0.9",
    name: "Interoperability Bridge",
    description: "Adapters for GS1, ISO 14064, GHG Protocol, and TCFD frameworks enabling cross-system data portability.",
    status: "Beta",
    link: "/docs",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Identify a Gap or Improvement",
    description: "Any community member or partner organization can identify an area in the framework that needs updating, clarifying, or expanding.",
  },
  {
    step: "02",
    title: "Draft a Proposal (SGEP)",
    description: "Submit a Smart Grid Enhancement Proposal using the standardized SGEP template. Proposals are assigned a public tracking number.",
  },
  {
    step: "03",
    title: "Community Review Period",
    description: "A minimum 21-day public comment period allows stakeholders to review, debate, and suggest amendments.",
  },
  {
    step: "04",
    title: "Governance Vote",
    description: "Eligible governance token holders vote on the proposal. Approval requires a defined quorum and supermajority threshold.",
  },
  {
    step: "05",
    title: "Implementation & Versioning",
    description: "Approved proposals are merged into the framework. A new versioned release is published, and all prior versions are archived.",
  },
];

export default function OpenFrameworkPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Open Framework</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
            The Infrastructure for <span className="text-emerald-400">Trusted</span> Climate Standards
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mb-10">
            SGE's Open Framework is a community-governed, publicly licensed system of standards, governance protocols, and certification rules — built for interoperability and accountability at scale.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
            >
              Join the Community
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Read the Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Core Principles</h2>
            <p className="text-white/40 max-w-2xl">
              The Open Framework is designed around six non-negotiable principles that ensure it remains credible, accessible, and community-controlled.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principles.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-600/10 mb-5">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Framework Components */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Framework Components</h2>
            <p className="text-white/40 max-w-2xl">
              The Open Framework is comprised of several interconnected components, each independently versioned and governed.
            </p>
          </div>
          <div className="space-y-4">
            {components.map((c) => (
              <div
                key={c.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 hover:border-white/[0.10] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs font-mono text-white/40">
                    {c.version}
                  </span>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-semibold text-white">{c.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        c.status === "Active"
                          ? "bg-emerald-600/20 text-emerald-400"
                          : "bg-yellow-600/20 text-yellow-400"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 max-w-2xl">{c.description}</p>
                  </div>
                </div>
                <Link
                  href={c.link}
                  className="shrink-0 inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  View Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">How the Framework Evolves</h2>
            <p className="text-white/40 max-w-2xl">
              No single entity controls the framework. Changes go through a transparent, community-governed process — the SGE Enhancement Proposal (SGEP) system.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-[23px] top-0 bottom-0 w-px bg-white/[0.06] hidden sm:block" />
            <div className="space-y-8">
              {howItWorks.map((step) => (
                <div key={step.step} className="flex gap-6">
                  <div className="shrink-0 relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-600/10 text-emerald-400 text-sm font-bold">
                    {step.step}
                  </div>
                  <div className="pt-2.5">
                    <h3 className="text-base font-semibold text-white mb-1.5">{step.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed max-w-2xl">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-16 border-t border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "42", label: "Published Standards" },
              { value: "180+", label: "Community Contributors" },
              { value: "97", label: "Proposals Processed" },
              { value: "v2.1", label: "Current Framework Version" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-emerald-400 mb-1">{stat.value}</div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-600/10 mb-6 mx-auto">
            <Zap className="h-7 w-7 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Help Shape What Comes Next</h2>
          <p className="text-white/40 max-w-xl mx-auto mb-8">
            Submit a framework enhancement proposal, join a standards committee, or contribute implementation code. The framework belongs to its community.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Become a Contributor
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/governance-public"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              View Governance
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
