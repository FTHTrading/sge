import { Target, Eye, Heart, Globe2, Users, Scale } from "lucide-react";

const values = [
  {
    icon: Globe2,
    title: "Global Impact",
    description:
      "We deploy renewable energy solutions across 47 countries, prioritizing regions with the greatest need for clean, reliable power.",
  },
  {
    icon: Eye,
    title: "Radical Transparency",
    description:
      "Every decision, milestone, and certification is recorded with immutable audit trails. Our governance is open and verifiable by anyone.",
  },
  {
    icon: Users,
    title: "Community Governance",
    description:
      "Partners and stakeholders have a direct voice in platform evolution through proposal-based governance with transparent voting.",
  },
  {
    icon: Scale,
    title: "Standards-Driven",
    description:
      "We define and enforce rigorous sustainability standards, with third-party attestation ensuring credibility and trustworthiness.",
  },
  {
    icon: Heart,
    title: "Equitable Access",
    description:
      "Open-access infrastructure ensures that climate solutions are available to all communities, not just those that can afford premium pricing.",
  },
  {
    icon: Target,
    title: "Measurable Outcomes",
    description:
      "Every deployment is tracked against KPIs with real-time dashboards, ensuring accountability and continuous improvement.",
  },
];

const milestones = [
  { year: "2021", title: "Foundation Established", description: "SGE Foundation incorporated with core mission and initial patent filings." },
  { year: "2022", title: "First Deployments", description: "Pilot deployments across 5 countries with AI optimization algorithms." },
  { year: "2023", title: "Standards Framework", description: "Published first 12 sustainability standards with certification pipeline." },
  { year: "2024", title: "Global Scale", description: "Expanded to 47 countries with 2,400+ MW deployed and 180+ active partners." },
];

export default function MissionPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Our Mission</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Accelerating the World&apos;s Transition to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Sustainable Energy
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              The SGE Foundation exists to build, deploy, and govern open-access
              climate infrastructure that makes renewable energy accessible,
              transparent, and verifiable for every community worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-12">Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-7 hover:bg-white/[0.02] transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-4">
                  <value.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-12">Our Journey</h2>
          <div className="space-y-8">
            {milestones.map((ms, index) => (
              <div key={ms.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-sm font-bold text-emerald-400 ring-2 ring-emerald-500/20">
                    {index + 1}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-white/[0.06] mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <span className="text-xs font-semibold text-emerald-400">{ms.year}</span>
                  <h3 className="text-lg font-semibold text-white mt-1">{ms.title}</h3>
                  <p className="text-sm text-white/40 mt-1">{ms.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
