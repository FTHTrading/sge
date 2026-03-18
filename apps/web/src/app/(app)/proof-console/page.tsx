import {
  Shield,
  Search,
  CheckCircle,
  Hash,
  Link as LinkIcon,
  FileCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";

const auditChain = [
  {
    id: "evt-48291",
    type: "milestone.verified",
    actor: "SGE Audit Team",
    subject: "Project SAHARA — Phase 2 Complete",
    timestamp: "2024-03-15 14:32:18 UTC",
    hash: "a3f2e1...8c4d",
    prevHash: "7b9d3c...1e2f",
    verified: true,
  },
  {
    id: "evt-48290",
    type: "certification.approved",
    actor: "Standards Committee",
    subject: "SolarGrid Corp — SGE-STD-005 Certification",
    timestamp: "2024-03-15 12:18:44 UTC",
    hash: "7b9d3c...1e2f",
    prevHash: "e4a1b7...9f3c",
    verified: true,
  },
  {
    id: "evt-48289",
    type: "governance.proposal_approved",
    actor: "Governance Engine",
    subject: "GOV-2024-047 — Bifacial Panel Standards",
    timestamp: "2024-03-15 10:05:22 UTC",
    hash: "e4a1b7...9f3c",
    prevHash: "1c8d4e...3a7b",
    verified: true,
  },
  {
    id: "evt-48288",
    type: "partner.onboarded",
    actor: "Admin Panel",
    subject: "Desert Sun Corp — Bronze Tier",
    timestamp: "2024-03-14 22:41:09 UTC",
    hash: "1c8d4e...3a7b",
    prevHash: "9e2f1a...5d8c",
    verified: true,
  },
  {
    id: "evt-48287",
    type: "standard.published",
    actor: "Standards Committee",
    subject: "SGE-STD-025 — Hybrid Storage Protocol v1.0",
    timestamp: "2024-03-14 18:12:33 UTC",
    hash: "9e2f1a...5d8c",
    prevHash: "4b7c3e...2f1a",
    verified: true,
  },
  {
    id: "evt-48286",
    type: "deployment.phase_complete",
    actor: "Project Manager",
    subject: "MONSOON-3D — Operational Status",
    timestamp: "2024-03-14 15:55:17 UTC",
    hash: "4b7c3e...2f1a",
    prevHash: "8d1e9c...7a4b",
    verified: true,
  },
];

const typeColors: Record<string, string> = {
  "milestone.verified": "bg-emerald-500/10 text-emerald-400",
  "certification.approved": "bg-blue-500/10 text-blue-400",
  "governance.proposal_approved": "bg-purple-500/10 text-purple-400",
  "partner.onboarded": "bg-amber-500/10 text-amber-400",
  "standard.published": "bg-cyan-500/10 text-cyan-400",
  "deployment.phase_complete": "bg-pink-500/10 text-pink-400",
};

export default function ProofConsolePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Proof Console</h1>
        <p className="text-sm text-white/40 mt-1">
          Immutable audit chain with SHA-256 hash integrity verification.
        </p>
      </div>

      {/* Chain Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">CHAIN VERIFIED</span>
          </div>
          <p className="text-2xl font-bold text-white">48,291</p>
          <p className="text-[10px] text-white/30 mt-1">Total audit events</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-white/25" />
            <span className="text-xs font-medium text-white/40">LATEST HASH</span>
          </div>
          <p className="text-sm font-mono text-emerald-400 break-all">
            a3f2e1d4c5b6a7e8f9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5...
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-white/25" />
            <span className="text-xs font-medium text-white/40">INTEGRITY</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">0</p>
          <p className="text-[10px] text-white/30 mt-1">Violations detected</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search audit events by hash, actor, or subject..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Event Chain */}
      <div className="space-y-3">
        {auditChain.map((event, index) => (
          <div
            key={event.id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                  {index < auditChain.length - 1 && (
                    <div className="w-px h-6 bg-white/[0.06] mt-1" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${typeColors[event.type] || "bg-white/[0.04] text-white/30"}`}>
                      {event.type}
                    </span>
                    <span className="text-[10px] text-white/20 font-mono">{event.id}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{event.subject}</p>
                  <p className="text-xs text-white/30 mt-1">
                    {event.actor} — {event.timestamp}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 ml-11 grid grid-cols-2 gap-4 text-[10px]">
              <div>
                <span className="text-white/20 uppercase tracking-wider">Hash</span>
                <p className="text-emerald-400/70 font-mono mt-0.5">{event.hash}</p>
              </div>
              <div>
                <span className="text-white/20 uppercase tracking-wider">Previous Hash</span>
                <p className="text-white/30 font-mono mt-0.5">{event.prevHash}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
