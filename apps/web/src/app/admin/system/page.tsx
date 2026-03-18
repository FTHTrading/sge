import {
  Server,
  Database,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  BarChart3,
  Globe,
} from "lucide-react";

const services = [
  { name: "Primary Database (PostgreSQL)", status: "healthy", cpu: "12%", memory: "4.2 GB", connections: "84/200", latency: "4ms", region: "US-East" },
  { name: "Read Replica (PostgreSQL)", status: "healthy", cpu: "8%", memory: "3.1 GB", connections: "45/200", latency: "6ms", region: "US-East" },
  { name: "Application Server (Node.js)", status: "healthy", cpu: "34%", memory: "2.8 GB", connections: "—", latency: "12ms", region: "US-East" },
  { name: "Audit Chain Engine", status: "healthy", cpu: "18%", memory: "1.4 GB", connections: "—", latency: "8ms", region: "US-East" },
  { name: "Background Job Worker", status: "healthy", cpu: "22%", memory: "1.1 GB", connections: "—", latency: "—", region: "US-East" },
  { name: "CDN / Static Assets", status: "healthy", cpu: "—", memory: "—", connections: "—", latency: "2ms", region: "Global" },
  { name: "Email Service (SMTP)", status: "degraded", cpu: "—", memory: "—", connections: "—", latency: "145ms", region: "US-East" },
  { name: "Object Storage (S3)", status: "healthy", cpu: "—", memory: "—", connections: "—", latency: "22ms", region: "US-East" },
];

const recentIncidents = [
  { title: "Email delivery latency spike", severity: "warning", started: "2024-03-15 14:22 UTC", duration: "Ongoing", status: "investigating" },
  { title: "Database connection pool exhaustion", severity: "resolved", started: "2024-03-14 09:15 UTC", duration: "12 min", status: "resolved" },
  { title: "CDN cache invalidation delay", severity: "resolved", started: "2024-03-12 18:45 UTC", duration: "35 min", status: "resolved" },
];

const configSections = [
  {
    title: "Environment",
    items: [
      { key: "NODE_ENV", value: "production", sensitive: false },
      { key: "DATABASE_URL", value: "postgresql://***@db.sge.internal:5432/sge_prod", sensitive: true },
      { key: "NEXTAUTH_URL", value: "https://platform.sge.foundation", sensitive: false },
      { key: "NEXTAUTH_SECRET", value: "••••••••••••••••", sensitive: true },
    ],
  },
  {
    title: "Feature Flags",
    items: [
      { key: "ENABLE_GOVERNANCE_VOTING", value: "true", sensitive: false },
      { key: "ENABLE_AUDIT_CHAIN_V2", value: "true", sensitive: false },
      { key: "ENABLE_MRV_PIPELINE", value: "false", sensitive: false },
      { key: "ENABLE_PUBLIC_API", value: "true", sensitive: false },
      { key: "ENABLE_WEBHOOK_EVENTS", value: "true", sensitive: false },
    ],
  },
  {
    title: "Rate Limits",
    items: [
      { key: "API_RATE_LIMIT_WINDOW", value: "60s", sensitive: false },
      { key: "API_RATE_LIMIT_MAX", value: "100", sensitive: false },
      { key: "AUTH_MAX_ATTEMPTS", value: "5", sensitive: false },
      { key: "AUTH_LOCKOUT_DURATION", value: "900s", sensitive: false },
    ],
  },
];

export default function AdminSystemPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health & Configuration</h1>
          <p className="text-sm text-white/40 mt-1">
            Infrastructure monitoring, service status, and platform configuration.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white/50 hover:text-white/70 transition-colors">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Services Up", value: `${services.filter(s => s.status === "healthy").length}/${services.length}`, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Avg Latency", value: "14ms", icon: Zap, color: "text-blue-400" },
          { label: "Open Incidents", value: "1", icon: AlertTriangle, color: "text-amber-400" },
          { label: "Uptime (30d)", value: "99.97%", icon: Activity, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Services Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Services</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Service</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">CPU</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Memory</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Connections</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Latency</th>
              <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Region</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01]">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <Server className="h-3.5 w-3.5 text-white/15" />
                    <span className="text-xs font-medium text-white/60">{svc.name}</span>
                  </div>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${svc.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    <span className={`text-[10px] capitalize ${svc.status === "healthy" ? "text-emerald-400" : "text-amber-400"}`}>
                      {svc.status}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-2.5 text-xs text-white/30">{svc.cpu}</td>
                <td className="px-5 py-2.5 text-xs text-white/30">{svc.memory}</td>
                <td className="px-5 py-2.5 text-xs text-white/30">{svc.connections}</td>
                <td className="px-5 py-2.5 text-xs text-white/30">{svc.latency}</td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-white/15" />
                    <span className="text-[10px] text-white/25">{svc.region}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incidents */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Recent Incidents</h2>
        <div className="space-y-3">
          {recentIncidents.map((incident, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3">
                {incident.severity === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
                <div>
                  <p className="text-xs font-medium text-white/60">{incident.title}</p>
                  <p className="text-[10px] text-white/25 mt-0.5">Started: {incident.started} · Duration: {incident.duration}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                incident.status === "investigating"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {incident.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white">Platform Configuration</h2>
        {configSections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">{section.title}</h3>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-1">
                  <code className="text-[11px] font-mono text-white/40">{item.key}</code>
                  <code className={`text-[11px] font-mono ${item.sensitive ? "text-white/15" : "text-emerald-400/60"}`}>
                    {item.value}
                  </code>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
