import { Shield, Check, FileCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const standards = [
  {
    code: "SGE-STD-001",
    title: "Solar Deployment Efficiency",
    clauses: 8,
    category: "Energy Production",
    description: "Minimum efficiency thresholds, monitoring requirements, and maintenance protocols for solar PV installations.",
  },
  {
    code: "SGE-STD-002",
    title: "Wind Turbine Operations",
    clauses: 6,
    category: "Energy Production",
    description: "Operational standards for wind turbine deployments including capacity factor requirements and environmental impact limits.",
  },
  {
    code: "SGE-STD-003",
    title: "Battery Storage Safety",
    clauses: 12,
    category: "Storage",
    description: "Comprehensive safety standards for lithium-ion and flow battery installations covering thermal management, fire suppression, and degradation monitoring.",
  },
  {
    code: "SGE-STD-004",
    title: "Grid Integration Protocol",
    clauses: 5,
    category: "Distribution",
    description: "Requirements for grid-tied renewable installations including power quality, ramp rate limits, and reactive power support.",
  },
  {
    code: "SGE-STD-005",
    title: "Carbon Offset Verification",
    clauses: 10,
    category: "Compliance",
    description: "Methodology for measuring, reporting, and verifying carbon offsets from renewable energy deployments with third-party attestation.",
  },
  {
    code: "SGE-STD-006",
    title: "Community Impact Assessment",
    clauses: 7,
    category: "Social",
    description: "Framework for assessing and reporting on local community impact including job creation, energy access, and educational programs.",
  },
];

const certProcess = [
  { step: 1, title: "Standard Selection", description: "Choose the applicable standards for your deployment type and region." },
  { step: 2, title: "Evidence Collection", description: "Gather required documentation, measurements, and attestations per clause requirements." },
  { step: 3, title: "Submission", description: "Submit your certification application with all evidence artifacts through the Alignment OS." },
  { step: 4, title: "Review & Verification", description: "Independent verifiers review submissions, request clarifications, and validate compliance." },
  { step: 5, title: "Certification", description: "Upon approval, receive your SGE certification with immutable proof anchored to the audit chain." },
];

export default function StandardsPublicPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Standards & Certification</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Rigorous{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Sustainability Standards
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              Our standards framework ensures every deployment meets measurable
              sustainability criteria. Certifications are backed by cryptographic
              proofs and third-party attestation.
            </p>
          </div>
        </div>
      </section>

      {/* Standards Grid */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Published Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {standards.map((std) => (
              <div
                key={std.code}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <code className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {std.code}
                  </code>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">
                    {std.category}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{std.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{std.description}</p>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>{std.clauses} clauses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Process */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-12">Certification Process</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {certProcess.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 h-full">
                  <div className="h-8 w-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-sm font-bold text-emerald-400 mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{step.description}</p>
                </div>
                {i < certProcess.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 h-4 w-4 text-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
