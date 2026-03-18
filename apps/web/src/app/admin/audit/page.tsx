import {
  Shield,
  Search,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  Hash,
  Link2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

const chainStats = {
  totalEvents: 48291,
  chainLength: 48291,
  chainIntegrity: "VERIFIED",
  lastHash: "a3f8c2d1e9b4...7f6a",
  violations: 0,
  lastVerified: "2024-03-15T15:30:00Z",
};

const eventTypes = [
  { type: "PARTNER", count: 8420, color: "bg-emerald-500" },
  { type: "PROJECT", count: 6815, color: "bg-blue-500" },
  { type: "MILESTONE", count: 12340, color: "bg-purple-500" },
  { type: "GOVERNANCE", count: 3280, color: "bg-amber-500" },
  { type: "STANDARD", count: 4156, color: "bg-cyan-500" },
  { type: "AUTH", count: 9870, color: "bg-white/20" },
  { type: "SYSTEM", count: 3410, color: "bg-red-500/50" },
];

const auditEvents = [
  {
    id: "#48291",
    timestamp: "2024-03-15T15:28:42Z",
    actor: "maria@sge.foundation",
    action: "partner.status_changed",
    resource: "partner:abandoned-solar-inc",
    details: "Status changed: active → suspended",
    hash: "a3f8c2d1e9b4...7f6a",
    prevHash: "92e7b5c3d8f1...4a2e",
    verified: true,
  },
  {
    id: "#48290",
    timestamp: "2024-03-15T15:22:10Z",
    actor: "system",
    action: "milestone.auto_verified",
    resource: "milestone:wp-gamma-4",
    details: "Auto-verified via MRV pipeline. Score: 98.2%",
    hash: "92e7b5c3d8f1...4a2e",
    prevHash: "71d4e8a9c2b6...5f3d",
    verified: true,
  },
  {
    id: "#48289",
    timestamp: "2024-03-15T15:18:55Z",
    actor: "sarah@meridian-solar.com",
    action: "deployment.phase_updated",
    resource: "deployment:meridian-solar-1a",
    details: "Phase: commissioning → operational",
    hash: "71d4e8a9c2b6...5f3d",
    prevHash: "b8c3f2a7d1e4...9g8h",
    verified: true,
  },
  {
    id: "#48288",
    timestamp: "2024-03-15T14:55:30Z",
    actor: "james@sge.foundation",
    action: "governance.proposal_created",
    resource: "proposal:SGP-2024-042",
    details: "Created: Carbon Credit Verification Protocol Update",
    hash: "b8c3f2a7d1e4...9g8h",
    prevHash: "d5a1e7c4b9f2...3k6m",
    verified: true,
  },
  {
    id: "#48287",
    timestamp: "2024-03-15T14:42:18Z",
    actor: "elena@arctech.co",
    action: "standard.submission_reviewed",
    resource: "submission:cert-2024-089",
    details: "Reviewed: APPROVED with 3 minor observations",
    hash: "d5a1e7c4b9f2...3k6m",
    prevHash: "f9b2c8d4e1a7...2j5n",
    verified: true,
  },
  {
    id: "#48286",
    timestamp: "2024-03-15T14:30:00Z",
    actor: "system",
    action: "report.generated",
    resource: "report:quarterly-impact-Q1-2024",
    details: "Auto-generated quarterly impact report",
    hash: "f9b2c8d4e1a7...2j5n",
    prevHash: "c4d8e2f7a9b1...8p3q",
    verified: true,
  },
  {
    id: "#48285",
    timestamp: "2024-03-15T14:12:45Z",
    actor: "david@greenpeak.com",
    action: "project.deployment_added",
    resource: "project:greenpeak-wind-farm",
    details: "Added deployment: GWF-Phase-3 (50MW)",
    hash: "c4d8e2f7a9b1...8p3q",
    prevHash: "a7f3b9e1d4c8...6r2s",
    verified: true,
  },
  {
    id: "#48284",
    timestamp: "2024-03-15T13:58:22Z",
    actor: "anya@volterra.io",
    action: "incentive.condition_met",
    resource: "incentive:early-adopter-plan",
    details: "Condition met: first_deployment for Volterra Systems",
    hash: "a7f3b9e1d4c8...6r2s",
    prevHash: "e2c7d4b8a1f9...5t9u",
    verified: true,
  },
];

const actionColors: Record<string, string> = {
  partner: "text-emerald-400",
  milestone: "text-purple-400",
  deployment: "text-blue-400",
  governance: "text-amber-400",
  standard: "text-cyan-400",
  report: "text-white/40",
  project: "text-blue-400",
  incentive: "text-pink-400",
};

function getActionColor(action: string): string {
  const prefix = action.split(".")[0] ?? "";
  return actionColors[prefix] ?? "text-white/30";
}

export default function AdminAuditPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Chain Explorer</h1>
          <p className="text-sm text-white/40 mt-1">
            Browse, search, and verify the immutable audit event chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
            Verify Chain
          </button>
        </div>
      </div>

      {/* Chain Integrity Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-400">Chain Integrity: VERIFIED</span>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-[10px] text-white/30 mt-0.5">
                {chainStats.totalEvents.toLocaleString()} events · 0 violations · Last verified: {new Date(chainStats.lastVerified).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/30">Latest Hash</p>
            <code className="text-[11px] font-mono text-emerald-400/60">{chainStats.lastHash}</code>
          </div>
        </div>
      </div>

      {/* Event Type Breakdown */}
      <div className="grid grid-cols-7 gap-3">
        {eventTypes.map((et) => (
          <div key={et.type} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 text-center">
            <div className={`h-1 w-8 rounded-full ${et.color} mx-auto mb-2`} />
            <p className="text-sm font-bold text-white">{et.count.toLocaleString()}</p>
            <p className="text-[9px] text-white/25 uppercase tracking-wider">{et.type}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Search by event ID, actor, action, resource, or hash..."
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
          <Filter className="h-3 w-3" />
          Action Type <ChevronDown className="h-3 w-3" />
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
          Date Range <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Audit Events Chain */}
      <div className="space-y-2">
        {auditEvents.map((event, index) => (
          <div key={event.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4 hover:bg-white/[0.015] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="text-[10px] font-mono text-white/20">{event.id}</span>
                  <span className={`text-xs font-medium ${getActionColor(event.action)}`}>
                    {event.action}
                  </span>
                  <span className="text-[10px] text-white/20">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-white/50">{event.details}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-white/20">
                    Actor: <span className="text-white/35">{event.actor}</span>
                  </span>
                  <span className="text-[10px] text-white/20">
                    Resource: <span className="text-white/35">{event.resource}</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {event.verified ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
              </div>
            </div>
            {/* Hash chain visualization */}
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-6">
              <div className="flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-white/10" />
                <code className="text-[10px] font-mono text-emerald-400/40">{event.hash}</code>
              </div>
              {index < auditEvents.length - 1 && (
                <div className="flex items-center gap-1.5">
                  <Link2 className="h-3 w-3 text-white/10" />
                  <code className="text-[10px] font-mono text-white/15">{event.prevHash}</code>
                  <span className="text-[9px] text-white/10">← prev</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-white/25">
        <span>Showing events #48284-#48291 of 48,291</span>
        <div className="flex items-center gap-1">
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">← Newer</button>
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">Older →</button>
        </div>
      </div>
    </div>
  );
}
