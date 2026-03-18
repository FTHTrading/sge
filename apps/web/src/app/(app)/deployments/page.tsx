import {
  Rocket,
  Search,
  Filter,
  MapPin,
  Zap,
  Activity,
  Server,
} from "lucide-react";

const deployments = [
  { id: "dep-001", name: "SAHARA-7A", project: "Project SAHARA", region: "Morocco", type: "Solar PV", mw: 85, phase: "operational", uptime: 99.4, efficiency: 94.2 },
  { id: "dep-002", name: "SAHARA-7B", project: "Project SAHARA", region: "Tunisia", type: "Solar PV", mw: 92, phase: "phase_2", uptime: 97.8, efficiency: 91.5 },
  { id: "dep-003", name: "ATLAS-12A", project: "Project ATLAS", region: "Spain", type: "Wind", mw: 110, phase: "phase_1", uptime: 96.2, efficiency: 88.7 },
  { id: "dep-004", name: "MONSOON-3C", project: "Project MONSOON", region: "Vietnam", type: "Solar+Storage", mw: 45, phase: "operational", uptime: 99.1, efficiency: 92.8 },
  { id: "dep-005", name: "AURORA-2A", project: "Project AURORA", region: "Norway", type: "Wind", mw: 80, phase: "phase_2", uptime: 98.5, efficiency: 90.3 },
  { id: "dep-006", name: "MONSOON-3D", project: "Project MONSOON", region: "Thailand", type: "Solar PV", mw: 55, phase: "operational", uptime: 99.6, efficiency: 95.1 },
];

const phaseColors: Record<string, string> = {
  pre_deployment: "bg-gray-500/10 text-gray-400",
  phase_1: "bg-blue-500/10 text-blue-400",
  phase_2: "bg-purple-500/10 text-purple-400",
  operational: "bg-emerald-500/10 text-emerald-400",
};

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Deployments</h1>
          <p className="text-sm text-white/40 mt-1">
            Monitor live energy deployments and operational metrics.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search deployments..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Grid summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <Rocket className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">24</p>
          <p className="text-[10px] text-white/30 uppercase">Total Deployments</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <Activity className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">98.7%</p>
          <p className="text-[10px] text-white/30 uppercase">Avg Uptime</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <Zap className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">2,418 MW</p>
          <p className="text-[10px] text-white/30 uppercase">Total Capacity</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <Server className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-bold text-white">92.4%</p>
          <p className="text-[10px] text-white/30 uppercase">Avg Efficiency</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.01]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Deployment</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Project</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Region</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Type</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">MW</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Phase</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Uptime</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((dep) => (
              <tr key={dep.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-white">{dep.name}</p>
                  <p className="text-[10px] text-white/25 font-mono">{dep.id}</p>
                </td>
                <td className="px-5 py-4 text-xs text-white/50">{dep.project}</td>
                <td className="px-5 py-4 text-xs text-white/40 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{dep.region}
                </td>
                <td className="px-5 py-4 text-xs text-white/40">{dep.type}</td>
                <td className="px-5 py-4 text-sm font-medium text-white/60">{dep.mw}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${phaseColors[dep.phase]}`}>
                    {dep.phase.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-emerald-400">{dep.uptime}%</td>
                <td className="px-5 py-4 text-sm text-white/60">{dep.efficiency}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
