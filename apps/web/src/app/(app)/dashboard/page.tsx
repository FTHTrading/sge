import {
  Zap,
  Users,
  FolderKanban,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe2,
  Award,
  FileCheck,
  Scale,
  BarChart3,
} from "lucide-react";

const kpis = [
  { title: "Total Partners", value: "182", change: "+12", trend: "up", icon: Users },
  { title: "Active Projects", value: "47", change: "+5", trend: "up", icon: FolderKanban },
  { title: "MW Deployed", value: "2,418", change: "+86", trend: "up", icon: Zap },
  { title: "Active Standards", value: "24", change: "+2", trend: "up", icon: Shield },
  { title: "Certifications", value: "342", change: "+18", trend: "up", icon: Award },
  { title: "Open Proposals", value: "8", change: "-2", trend: "down", icon: Scale },
];

const recentActivity = [
  { event: "Partner Onboarded", subject: "SunVolt Energy — Gold Tier", time: "2 hours ago", icon: Users },
  { event: "Milestone Verified", subject: "Project SAHARA-7 — Phase 2 Complete", time: "4 hours ago", icon: FileCheck },
  { event: "Standard Published", subject: "SGE-STD-025: Hybrid Storage Protocol", time: "6 hours ago", icon: Shield },
  { event: "Proposal Approved", subject: "GOV-2024-048: Regional Council Charter", time: "8 hours ago", icon: Scale },
  { event: "Certification Issued", subject: "SolarGrid Corp — Carbon Offset v2.1", time: "12 hours ago", icon: Award },
  { event: "Deployment Started", subject: "Project ATLAS-12 — Phase 1 Kickoff", time: "1 day ago", icon: Activity },
];

const topProjects = [
  { name: "Project SAHARA", region: "North Africa", mw: 340, progress: 78, status: "active" },
  { name: "Project ATLAS", region: "Southern Europe", mw: 220, progress: 45, status: "active" },
  { name: "Project MONSOON", region: "Southeast Asia", mw: 180, progress: 92, status: "active" },
  { name: "Project AURORA", region: "Scandinavia", mw: 160, progress: 62, status: "active" },
  { name: "Project TRADE WIND", region: "Caribbean", mw: 120, progress: 34, status: "planning" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">
          Global ecosystem overview — real-time KPIs and activity feed.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className="h-4 w-4 text-white/25" />
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                  kpi.trend === "up" ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {kpi.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">
              {kpi.title}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-600/10 flex items-center justify-center flex-shrink-0">
                  <activity.icon className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/70 truncate">
                    {activity.event}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">{activity.subject}</p>
                  <p className="text-[10px] text-white/20 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Projects */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Top Deployments</h2>
          <div className="space-y-3">
            {topProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {project.name}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        project.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {project.region} &middot; {project.mw} MW
                  </p>
                </div>
                <div className="w-32 flex-shrink-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/30">Progress</span>
                    <span className="text-[10px] font-semibold text-white/50">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-white/50">Audit Chain</span>
          </div>
          <p className="text-lg font-bold text-white">Verified</p>
          <p className="text-[10px] text-white/30 mt-1">
            48,291 events • 0 integrity violations
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-white/50">API Status</span>
          </div>
          <p className="text-lg font-bold text-white">Operational</p>
          <p className="text-[10px] text-white/30 mt-1">
            99.97% uptime • 42ms avg response
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-white/50">Governance</span>
          </div>
          <p className="text-lg font-bold text-white">8 Active</p>
          <p className="text-[10px] text-white/30 mt-1">
            3 proposals in voting period
          </p>
        </div>
      </div>
    </div>
  );
}
