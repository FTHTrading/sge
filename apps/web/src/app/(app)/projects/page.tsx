import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  MapPin,
  Zap,
  Calendar,
  ChevronRight,
} from "lucide-react";

const projects = [
  { id: "proj-001", name: "Project SAHARA", region: "North Africa", partner: "SunVolt Energy", mw: 340, status: "active", phase: "phase_2", deployments: 4, startDate: "2022-06-15" },
  { id: "proj-002", name: "Project ATLAS", region: "Southern Europe", partner: "GreenPeak Solutions", mw: 220, status: "active", phase: "phase_1", deployments: 3, startDate: "2023-01-20" },
  { id: "proj-003", name: "Project MONSOON", region: "Southeast Asia", partner: "SolarGrid Corp", mw: 180, status: "active", phase: "phase_3", deployments: 5, startDate: "2022-09-10" },
  { id: "proj-004", name: "Project AURORA", region: "Scandinavia", partner: "NorthWind Systems", mw: 160, status: "active", phase: "phase_2", deployments: 3, startDate: "2022-04-22" },
  { id: "proj-005", name: "Project TRADE WIND", region: "Caribbean", partner: "AquaPower Ltd", mw: 120, status: "planning", phase: "pre_deployment", deployments: 0, startDate: "2024-01-05" },
  { id: "proj-006", name: "Project OASIS", region: "Middle East", partner: "Desert Sun Corp", mw: 200, status: "planning", phase: "pre_deployment", deployments: 0, startDate: "2024-02-01" },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  planning: "bg-blue-500/10 text-blue-400",
  completed: "bg-white/10 text-white/60",
  paused: "bg-amber-500/10 text-amber-400",
};

const phaseLabels: Record<string, string> = {
  pre_deployment: "Pre-Deploy",
  phase_1: "Phase 1",
  phase_2: "Phase 2",
  phase_3: "Phase 3",
  operational: "Operational",
  decommissioned: "Decommissioned",
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/40 mt-1">
            Track energy deployment projects across all regions.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search projects..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-white/30 font-mono mt-0.5">{project.id}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[project.status]}`}>
                {project.status}
              </span>
            </div>

            <div className="space-y-2 text-xs text-white/40">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-white/20" />
                {project.region} — {project.partner}
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-white/20" />
                {project.mw} MW capacity
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-white/20" />
                Started {project.startDate}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-white/25">
                {phaseLabels[project.phase]} — {project.deployments} deployments
              </span>
              <ChevronRight className="h-4 w-4 text-white/15 group-hover:text-white/40 transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
