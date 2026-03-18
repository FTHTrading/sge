import {
  Target,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Circle,
} from "lucide-react";

const milestoneData = [
  { id: "ms-001", title: "Site Survey Complete", project: "Project SAHARA", status: "verified", dueDate: "2024-01-15", verifiedDate: "2024-01-12", verifier: "SGE Audit Team" },
  { id: "ms-002", title: "Foundation Poured & Cured", project: "Project SAHARA", status: "verified", dueDate: "2024-03-01", verifiedDate: "2024-02-28", verifier: "SGE Audit Team" },
  { id: "ms-003", title: "Panel Installation 50%", project: "Project SAHARA", status: "in_progress", dueDate: "2024-06-01", verifiedDate: null, verifier: null },
  { id: "ms-004", title: "Grid Connection Approved", project: "Project ATLAS", status: "verified", dueDate: "2024-02-01", verifiedDate: "2024-01-29", verifier: "EU Energy Authority" },
  { id: "ms-005", title: "Turbine Assembly 25%", project: "Project ATLAS", status: "in_progress", dueDate: "2024-05-15", verifiedDate: null, verifier: null },
  { id: "ms-006", title: "Environmental Impact Assessment", project: "Project TRADE WIND", status: "pending", dueDate: "2024-04-01", verifiedDate: null, verifier: null },
  { id: "ms-007", title: "Community Benefit Agreement", project: "Project OASIS", status: "not_started", dueDate: "2024-07-01", verifiedDate: null, verifier: null },
  { id: "ms-008", title: "First Energy Production", project: "Project MONSOON", status: "verified", dueDate: "2023-12-01", verifiedDate: "2023-11-28", verifier: "ASEAN Grid Authority" },
];

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  verified: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle, label: "Verified" },
  in_progress: { color: "bg-blue-500/10 text-blue-400", icon: Clock, label: "In Progress" },
  pending: { color: "bg-amber-500/10 text-amber-400", icon: AlertCircle, label: "Pending" },
  not_started: { color: "bg-white/[0.04] text-white/30", icon: Circle, label: "Not Started" },
  failed: { color: "bg-red-500/10 text-red-400", icon: AlertCircle, label: "Failed" },
};

export default function MilestonesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Milestones</h1>
          <p className="text-sm text-white/40 mt-1">
            Track and verify project milestones with proof artifacts.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          Add Milestone
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search milestones..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(statusConfig).filter(([k]) => k !== "failed").map(([key, config]) => {
          const count = milestoneData.filter((m) => m.status === key).length;
          const StatusIcon = config.icon;
          return (
            <div key={key} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.color.split(" ")[0]}`}>
                <StatusIcon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-wider">{config.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        {milestoneData.map((ms) => {
          const sc = statusConfig[ms.status] ?? { color: "bg-white/[0.04] text-white/30", icon: Circle, label: ms.status };
          const StatusIcon = sc.icon;
          return (
            <div
              key={ms.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.color.split(" ")[0]}`}>
                    <StatusIcon className={`h-4 w-4 ${sc.color.split(" ")[1]}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{ms.title}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{ms.project}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
              <div className="mt-3 ml-11 flex items-center gap-4 text-[10px] text-white/25">
                <span>Due: {ms.dueDate}</span>
                {ms.verifiedDate && <span>Verified: {ms.verifiedDate}</span>}
                {ms.verifier && <span>By: {ms.verifier}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
