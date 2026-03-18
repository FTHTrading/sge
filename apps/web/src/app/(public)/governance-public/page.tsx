import { Scale, Vote, FileText, Users, CheckCircle, Clock } from "lucide-react";

const principles = [
  {
    icon: Scale,
    title: "Weighted Voting",
    description: "Voting power is determined by partner tier, stake, and verified deployment capacity. Ensures decisions reflect real-world commitment.",
  },
  {
    icon: Users,
    title: "Inclusive Participation",
    description: "All partners can submit proposals regardless of tier. Discussion periods ensure every voice is heard before votes are cast.",
  },
  {
    icon: FileText,
    title: "Transparent Records",
    description: "Every proposal, vote, and resolution is recorded in the immutable audit chain with cryptographic proof of integrity.",
  },
  {
    icon: CheckCircle,
    title: "Quorum Enforcement",
    description: "Configurable quorum thresholds ensure decisions have sufficient participation to be considered legitimate and binding.",
  },
];

const proposalTypes = [
  {
    type: "Standard Amendment",
    description: "Propose changes to existing sustainability standards or create new ones.",
    quorum: "60%",
    avgDuration: "14 days",
  },
  {
    type: "Governance Policy",
    description: "Changes to governance rules, voting weights, or quorum requirements.",
    quorum: "75%",
    avgDuration: "21 days",
  },
  {
    type: "Resource Allocation",
    description: "Direct ecosystem resources toward specific projects, regions, or initiatives.",
    quorum: "50%",
    avgDuration: "10 days",
  },
  {
    type: "Partner Elevation",
    description: "Elevate partners to higher tiers based on demonstrated capacity and contribution.",
    quorum: "65%",
    avgDuration: "7 days",
  },
];

const recentResolutions = [
  { id: "GOV-2024-047", title: "Expand Solar Standards to Bifacial Panels", status: "approved", votes: "142/180" },
  { id: "GOV-2024-046", title: "Update Carbon Offset Methodology v2.1", status: "approved", votes: "158/180" },
  { id: "GOV-2024-045", title: "Add Community Benefit Clause to All Standards", status: "approved", votes: "134/180" },
  { id: "GOV-2024-044", title: "Increase Quorum for Policy Changes to 80%", status: "rejected", votes: "89/180" },
  { id: "GOV-2024-043", title: "Establish Regional Advisory Councils", status: "approved", votes: "167/180" },
];

export default function GovernancePublicPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Governance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Transparent{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Community Governance
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              Our governance framework ensures every decision is made
              transparently, with full participation from the partner ecosystem,
              and permanently recorded for accountability.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Governance Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-7">
                <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center mb-4">
                  <p.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{p.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proposal Types */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Proposal Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {proposalTypes.map((pt) => (
              <div key={pt.type} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
                <h3 className="text-base font-semibold text-white mb-2">{pt.type}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{pt.description}</p>
                <div className="flex gap-4 text-xs text-white/30">
                  <span className="flex items-center gap-1.5">
                    <Vote className="h-3.5 w-3.5" />
                    Quorum: {pt.quorum}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Avg: {pt.avgDuration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Resolutions */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Recent Resolutions</h2>
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">ID</th>
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Resolution</th>
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Votes</th>
                </tr>
              </thead>
              <tbody>
                {recentResolutions.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-6 py-4 text-xs font-mono text-emerald-400">{r.id}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{r.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          r.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">{r.votes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
