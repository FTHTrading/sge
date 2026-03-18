import {
  Cpu,
  Zap,
  Database,
  Shield,
  Network,
  BarChart3,
  Layers,
  Cloud,
} from "lucide-react";

const techLayers = [
  {
    icon: Cpu,
    title: "AI Optimization Engine",
    description:
      "Patent-pending neural network architecture that processes real-time telemetry from energy deployments to optimize production, storage allocation, and grid distribution. Achieves 23% higher output than conventional MPPT controllers.",
    stats: "23% efficiency gain",
  },
  {
    icon: Database,
    title: "Immutable Audit Layer",
    description:
      "Hash-chained event system with SHA-256 cryptographic proofs. Every partner action, milestone verification, standard certification, and governance decision is permanently recorded with tamper-evident integrity verification.",
    stats: "SHA-256 chain integrity",
  },
  {
    icon: Shield,
    title: "Standards & Certification Engine",
    description:
      "Define multi-clause sustainability standards with evidence requirements. Automated submission pipeline with third-party attestation workflow, versioning, and compliance tracking across the entire partner ecosystem.",
    stats: "24 active standards",
  },
  {
    icon: Network,
    title: "Governance Framework",
    description:
      "Proposal-driven governance with configurable quorum thresholds, weighted voting based on partner tier and stake, resolution tracking, and full audit trail. Every governance action is cryptographically anchored.",
    stats: "Weighted quorum voting",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Real-time dashboards with configurable KPIs, trend analysis, and exportable reports. Track partner performance, project milestones, certification compliance, and energy production metrics.",
    stats: "Real-time KPI tracking",
  },
  {
    icon: Cloud,
    title: "API & Integration Layer",
    description:
      "RESTful API with TypeScript SDK for third-party integrations. Webhook subscriptions for event-driven architectures. Support for IoT telemetry ingestion from solar, wind, and battery systems.",
    stats: "Full REST + SDK",
  },
];

const architectureDetails = [
  { label: "Frontend", value: "Next.js 14 + React 18" },
  { label: "State", value: "Zustand + TanStack Query" },
  { label: "Database", value: "PostgreSQL + Prisma ORM" },
  { label: "Auth", value: "NextAuth.js + RBAC" },
  { label: "Validation", value: "Zod schemas" },
  { label: "Design", value: "Tailwind CSS + Glass UI" },
  { label: "Build", value: "Turborepo + pnpm" },
  { label: "Audit", value: "SHA-256 hash chains" },
];

export default function TechnologyPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Technology</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Enterprise-Grade{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Climate Tech
              </span>{" "}
              Stack
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              A vertically integrated platform combining AI optimization,
              immutable audit infrastructure, standards certification, and
              transparent governance into a single operating system for global
              energy deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {architectureDetails.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  {item.label}
                </p>
                <p className="text-xs text-white/60 mt-1 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Detail */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-12">Platform Layers</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {techLayers.map((layer) => (
              <div
                key={layer.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <layer.icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/70 bg-emerald-500/5 px-2.5 py-1 rounded-full">
                    {layer.stats}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{layer.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{layer.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Framework */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-3xl border border-white/[0.06] bg-gradient-to-br from-emerald-600/5 to-transparent p-12 text-center">
            <Layers className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Open Framework Architecture
            </h2>
            <p className="text-white/40 max-w-lg mx-auto">
              Our TypeScript SDK and REST API allow any organization to integrate
              with the SGE Alignment OS. Build custom dashboards, connect IoT
              devices, or extend governance workflows.
            </p>
            <code className="mt-6 inline-block rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-emerald-400 font-mono">
              npm install @sge/sdk
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
