import {
  Users,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Key,
  Settings,
} from "lucide-react";
import Link from "next/link";

const adminStats = [
  { label: "Total Users", value: "1,247", icon: Users, color: "text-emerald-400" },
  { label: "Active Sessions", value: "342", icon: Activity, color: "text-blue-400" },
  { label: "API Keys", value: "89", icon: Key, color: "text-purple-400" },
  { label: "Audit Events", value: "48,291", icon: Shield, color: "text-amber-400" },
];

const systemHealth = [
  { service: "PostgreSQL Database", status: "healthy", latency: "4ms", uptime: "99.99%" },
  { service: "Next.js Application", status: "healthy", latency: "12ms", uptime: "99.97%" },
  { service: "Audit Chain Engine", status: "healthy", latency: "8ms", uptime: "100%" },
  { service: "Background Workers", status: "healthy", latency: "—", uptime: "99.95%" },
  { service: "File Storage (S3)", status: "healthy", latency: "22ms", uptime: "99.99%" },
  { service: "Email Service", status: "degraded", latency: "145ms", uptime: "98.2%" },
];

const recentAdminActions = [
  { action: "User role updated", actor: "admin@sge.foundation", target: "user:rachel@greenpeak.com → partner_admin", time: "15 min ago" },
  { action: "Partner suspended", actor: "admin@sge.foundation", target: "partner:abandoned-solar-inc", time: "2 hours ago" },
  { action: "Standard published", actor: "standards@sge.foundation", target: "SGE-STD-025 v1.0", time: "6 hours ago" },
  { action: "API key revoked", actor: "admin@sge.foundation", target: "key:sk_prod_...3f2a", time: "1 day ago" },
  { action: "Database migration", actor: "system", target: "migration:20240315_add_hybrid_storage", time: "1 day ago" },
];

const adminLinks = [
  { href: "/admin/users", label: "User Management", description: "Manage users, roles, and permissions", icon: Users },
  { href: "/admin/system", label: "System Health", description: "Monitor services, databases, and infrastructure", icon: Server },
  { href: "/admin/audit", label: "Audit Explorer", description: "Browse and verify the full audit chain", icon: Shield },
  { href: "/admin/config", label: "Platform Config", description: "Environment variables, feature flags, and limits", icon: Settings },
];

export default function AdminPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
            Admin Zone
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Administration</h1>
        <p className="text-sm text-white/40 mt-1">
          Platform management, system monitoring, and user administration.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5">
            <stat.icon className={`h-4 w-4 ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-emerald-600/10 transition-colors mb-3">
              <link.icon className="h-5 w-5 text-white/25 group-hover:text-emerald-400 transition-colors" />
            </div>
            <h3 className="text-sm font-semibold text-white">{link.label}</h3>
            <p className="text-xs text-white/30 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">System Health</h2>
          <div className="space-y-3">
            {systemHealth.map((service) => (
              <div key={service.service} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      service.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-xs text-white/60">{service.service}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-white/25">
                  <span>{service.latency}</span>
                  <span>{service.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Admin Actions</h2>
          <div className="space-y-3">
            {recentAdminActions.map((action, i) => (
              <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
                <p className="text-xs font-medium text-white/60">{action.action}</p>
                <p className="text-[10px] text-white/25 mt-0.5">{action.target}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-white/20">
                  <span>{action.actor}</span>
                  <span>·</span>
                  <span>{action.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
