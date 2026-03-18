import { BookOpen, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

const papers = [
  {
    title: "AI-Optimized Energy Distribution Networks",
    authors: "SGE Research Lab",
    date: "March 2024",
    abstract:
      "This paper presents our patent-pending neural network architecture for real-time optimization of renewable energy distribution across heterogeneous grid topologies.",
    tags: ["AI/ML", "Grid Optimization", "Neural Networks"],
  },
  {
    title: "Hash-Chained Audit Systems for Climate Infrastructure",
    authors: "SGE Governance Team",
    date: "January 2024",
    abstract:
      "A cryptographic framework for creating immutable, verifiable audit trails in distributed climate infrastructure systems using SHA-256 hash chains.",
    tags: ["Cryptography", "Audit", "Immutability"],
  },
  {
    title: "Standards-Based Certification for Renewable Deployments",
    authors: "SGE Standards Committee",
    date: "November 2023",
    abstract:
      "A methodology for defining, publishing, and certifying compliance against multi-clause sustainability standards with automated evidence collection.",
    tags: ["Standards", "Certification", "Compliance"],
  },
  {
    title: "Community Governance Models for Decentralized Energy Networks",
    authors: "SGE Governance Team",
    date: "August 2023",
    abstract:
      "An analysis of governance frameworks for community-owned energy infrastructure, with proposals for weighted voting and quorum-based decision making.",
    tags: ["Governance", "Community", "Voting"],
  },
  {
    title: "Predictive Maintenance for Solar PV Arrays Using Edge AI",
    authors: "SGE Research Lab",
    date: "May 2023",
    abstract:
      "Deploying lightweight edge models on IoT devices for predictive fault detection in solar PV installations, reducing downtime by 34%.",
    tags: ["Edge AI", "Solar", "IoT"],
  },
];

const patents = [
  { id: "US-PAT-2024-001", title: "AI Energy Distribution Optimization System", status: "Granted" },
  { id: "US-PAT-2024-002", title: "Cryptographic Audit Chain for Climate Data", status: "Pending" },
  { id: "US-PAT-2023-003", title: "Adaptive Solar MPPT with Neural Control", status: "Granted" },
  { id: "US-PAT-2023-004", title: "Multi-Source Energy Arbitrage Algorithm", status: "Pending" },
];

export default function ResearchPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Research & Innovation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Advancing Climate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Technology
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              Our research program publishes open-access papers, holds multiple
              patents, and continuously advances the state of AI-powered energy
              optimization and governance systems.
            </p>
          </div>
        </div>
      </section>

      {/* Papers */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Publications</h2>
          <div className="space-y-5">
            {papers.map((paper) => (
              <div
                key={paper.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-white mb-1">{paper.title}</h3>
                    <p className="text-xs text-white/30 mb-3">
                      {paper.authors} &middot; {paper.date}
                    </p>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">{paper.abstract}</p>
                    <div className="flex flex-wrap gap-2">
                      {paper.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium text-white/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="rounded-lg border border-white/[0.06] p-2 text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-colors flex-shrink-0">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Patents */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Patent Portfolio</h2>
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">ID</th>
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Title</th>
                  <th className="text-left px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
                </tr>
              </thead>
              <tbody>
                {patents.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-6 py-4 text-xs font-mono text-emerald-400">{p.id}</td>
                    <td className="px-6 py-4 text-sm text-white/70">{p.title}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          p.status === "Granted"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
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
