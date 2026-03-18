import {
  Users,
  Shield,
  MoreHorizontal,
  Search,
  ChevronDown,
  UserPlus,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const users = [
  { name: "Maria Alvarado", email: "maria@sge.foundation", role: "super_admin", status: "active", org: "SGE Foundation", lastLogin: "5 min ago" },
  { name: "James Chen", email: "james@sge.foundation", role: "admin", status: "active", org: "SGE Foundation", lastLogin: "2 hours ago" },
  { name: "Sarah Park", email: "sarah@meridian-solar.com", role: "partner_admin", status: "active", org: "Meridian Solar Group", lastLogin: "1 day ago" },
  { name: "David Osei", email: "david@greenpeak.com", role: "partner_admin", status: "active", org: "GreenPeak Energy", lastLogin: "3 hours ago" },
  { name: "Anya Petrov", email: "anya@volterra.io", role: "partner_manager", status: "active", org: "Volterra Systems", lastLogin: "6 hours ago" },
  { name: "Marcus Williams", email: "marcus@solisnetwork.com", role: "partner_member", status: "active", org: "Solis Network", lastLogin: "12 hours ago" },
  { name: "Lin Wei", email: "lin@sunforge.cn", role: "partner_manager", status: "active", org: "SunForge Ltd", lastLogin: "1 day ago" },
  { name: "Robert Nakamura", email: "robert@windcrest.com", role: "partner_member", status: "suspended", org: "Windcrest Energy", lastLogin: "30 days ago" },
  { name: "Elena Rodriguez", email: "elena@arctech.co", role: "auditor", status: "active", org: "Arctech Partners", lastLogin: "4 hours ago" },
  { name: "Thomas Bergmann", email: "thomas@eu-energy.de", role: "viewer", status: "active", org: "EU Energy Council", lastLogin: "2 days ago" },
  { name: "Fatima Al-Sayed", email: "fatima@cleantech.sa", role: "partner_admin", status: "pending", org: "CleanTech Saudi", lastLogin: "—" },
  { name: "Kevin Durand", email: "kevin@greenwatt.fr", role: "partner_member", status: "active", org: "GreenWatt France", lastLogin: "5 hours ago" },
];

const roleColors: Record<string, string> = {
  super_admin: "bg-red-500/10 text-red-400 border-red-500/20",
  admin: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  partner_admin: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  partner_manager: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  partner_member: "bg-white/5 text-white/50 border-white/10",
  auditor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  viewer: "bg-white/5 text-white/30 border-white/10",
};

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  active: { icon: CheckCircle, color: "text-emerald-400" },
  suspended: { icon: XCircle, color: "text-red-400" },
  pending: { icon: Clock, color: "text-amber-400" },
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage platform users, roles, and permissions.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
          <UserPlus className="h-4 w-4" />
          Invite User
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: users.length.toString() },
          { label: "Active", value: users.filter((u) => u.status === "active").length.toString() },
          { label: "Pending", value: users.filter((u) => u.status === "pending").length.toString() },
          { label: "Suspended", value: users.filter((u) => u.status === "suspended").length.toString() },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-4">
            <p className="text-lg font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Search users by name, email, or organization..."
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
          Role <ChevronDown className="h-3 w-3" />
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/40 hover:text-white/60 transition-colors">
          Status <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Organization</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Last Login</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const StatusIcon = statusConfig[user.status]?.icon ?? CheckCircle;
              return (
                <tr key={user.email} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px] font-bold text-white/30">
                        {user.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{user.name}</p>
                        <p className="text-[10px] text-white/25">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${roleColors[user.role] || roleColors.viewer}`}>
                      {user.role.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/40">{user.org}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`h-3 w-3 ${statusConfig[user.status]?.color || "text-white/20"}`} />
                      <span className="text-xs text-white/40 capitalize">{user.status}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/25">{user.lastLogin}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="rounded p-1 text-white/15 hover:text-white/40 hover:bg-white/5 transition-colors" title="Send email">
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded p-1 text-white/15 hover:text-white/40 hover:bg-white/5 transition-colors" title="Permissions">
                        <Shield className="h-3.5 w-3.5" />
                      </button>
                      <button className="rounded p-1 text-white/15 hover:text-white/40 hover:bg-white/5 transition-colors" title="More">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-white/25">
        <span>Showing 1-12 of 1,247 users</span>
        <div className="flex items-center gap-1">
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">Previous</button>
          <button className="rounded px-3 py-1.5 bg-white/[0.06] text-white/60">1</button>
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">2</button>
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">3</button>
          <button className="rounded px-3 py-1.5 hover:bg-white/5 transition-colors">Next</button>
        </div>
      </div>
    </div>
  );
}
