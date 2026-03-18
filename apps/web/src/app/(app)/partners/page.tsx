import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Globe2,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

const partners = [
  { id: "p-001", name: "SunVolt Energy", tier: "platinum", status: "active", region: "North Africa", projects: 8, mw: 340, joined: "2022-03-15" },
  { id: "p-002", name: "WindStream Global", tier: "gold", status: "active", region: "Northern Europe", projects: 5, mw: 220, joined: "2022-06-01" },
  { id: "p-003", name: "SolarGrid Corp", tier: "gold", status: "active", region: "Southeast Asia", projects: 4, mw: 180, joined: "2022-09-10" },
  { id: "p-004", name: "GreenPeak Solutions", tier: "silver", status: "active", region: "Southern Europe", projects: 3, mw: 95, joined: "2023-01-20" },
  { id: "p-005", name: "AquaPower Ltd", tier: "silver", status: "pending_review", region: "South America", projects: 2, mw: 60, joined: "2023-04-12" },
  { id: "p-006", name: "BioEnergy Partners", tier: "bronze", status: "active", region: "West Africa", projects: 1, mw: 25, joined: "2023-07-08" },
  { id: "p-007", name: "NorthWind Systems", tier: "gold", status: "active", region: "Scandinavia", projects: 6, mw: 160, joined: "2022-04-22" },
  { id: "p-008", name: "Desert Sun Corp", tier: "bronze", status: "onboarding", region: "Middle East", projects: 0, mw: 0, joined: "2024-01-05" },
];

const tierColors: Record<string, string> = {
  platinum: "bg-white/10 text-white",
  gold: "bg-amber-500/10 text-amber-400",
  silver: "bg-gray-400/10 text-gray-400",
  bronze: "bg-amber-700/10 text-amber-600",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  pending_review: "bg-amber-500/10 text-amber-400",
  onboarding: "bg-blue-500/10 text-blue-400",
  suspended: "bg-red-500/10 text-red-400",
};

export default function PartnersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Partners</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage ecosystem partners, tiers, and alignment status.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          Add Partner
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search partners..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-white/50 hover:bg-white/[0.04] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <p className="text-2xl font-bold text-white">182</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">164</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Active</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">12</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Pending</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">6</p>
          <p className="text-[10px] text-white/30 uppercase tracking-wider">Onboarding</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.01]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Partner</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Tier</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Region</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Projects</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">MW</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30"></th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white/30" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{partner.name}</p>
                      <p className="text-[10px] text-white/25 font-mono">{partner.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${tierColors[partner.tier]}`}>
                    {partner.tier}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[partner.status]}`}>
                    {partner.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-xs text-white/40 flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    {partner.region}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-white/60">{partner.projects}</td>
                <td className="px-5 py-4 text-sm text-white/60">{partner.mw}</td>
                <td className="px-5 py-4">
                  <Link
                    href={`/partners/${partner.id}`}
                    className="rounded-md p-1.5 text-white/20 hover:bg-white/[0.04] hover:text-white/50 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
