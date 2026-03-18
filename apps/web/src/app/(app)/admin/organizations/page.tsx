"use client";

import { useState } from "react";
import {
  Building,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Globe,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";

const mockOrgs = [
  {
    id: "org_1",
    name: "Meridian Energy Partners",
    type: "Partner",
    tier: "Premier",
    status: "active",
    country: "USA",
    contacts: 4,
    certifications: 7,
    joinedAt: "2024-03-12",
  },
  {
    id: "org_2",
    name: "Volta Infrastructure GmbH",
    type: "Partner",
    tier: "Standard",
    status: "active",
    country: "Germany",
    contacts: 2,
    certifications: 3,
    joinedAt: "2024-07-08",
  },
  {
    id: "org_3",
    name: "Sunrise Solar Collective",
    type: "Partner",
    tier: "Associate",
    status: "pending",
    country: "Australia",
    contacts: 1,
    certifications: 0,
    joinedAt: "2024-11-30",
  },
  {
    id: "org_4",
    name: "Nordic Grid Research Lab",
    type: "Researcher",
    tier: "—",
    status: "active",
    country: "Sweden",
    contacts: 5,
    certifications: 1,
    joinedAt: "2024-01-22",
  },
  {
    id: "org_5",
    name: "TerraVolt Systems",
    type: "Partner",
    tier: "Premier",
    status: "active",
    country: "Canada",
    contacts: 6,
    certifications: 11,
    joinedAt: "2023-09-15",
  },
  {
    id: "org_6",
    name: "Helix Renewables Ltd",
    type: "Partner",
    tier: "Standard",
    status: "suspended",
    country: "UK",
    contacts: 3,
    certifications: 2,
    joinedAt: "2024-05-19",
  },
];

const STATUS_CONFIG = {
  active: {
    label: "Active",
    icon: CheckCircle,
    className: "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-600/15 text-yellow-400 border-yellow-600/20",
  },
  suspended: {
    label: "Suspended",
    icon: XCircle,
    className: "bg-red-600/15 text-red-400 border-red-600/20",
  },
} as const;

const TIER_COLORS: Record<string, string> = {
  Premier: "text-emerald-400",
  Standard: "text-blue-400",
  Associate: "text-white/50",
  "—": "text-white/25",
};

export default function AdminOrganizationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended">("all");

  const filtered = mockOrgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.country.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: mockOrgs.length,
    active: mockOrgs.filter((o) => o.status === "active").length,
    pending: mockOrgs.filter((o) => o.status === "pending").length,
    suspended: mockOrgs.filter((o) => o.status === "suspended").length,
  };

  return (
    <div className="min-h-screen bg-[hsl(220,16%,3%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Building className="h-5 w-5 text-white/30" />
              <h1 className="text-xl font-bold text-white">Organizations</h1>
            </div>
            <p className="text-sm text-white/40">
              Manage partner organizations, researchers, and external entities.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
            <Plus className="h-4 w-4" />
            Add Organization
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total", value: counts.all, color: "text-white" },
            { label: "Active", value: counts.active, color: "text-emerald-400" },
            { label: "Pending", value: counts.pending, color: "text-yellow-400" },
            { label: "Suspended", value: counts.suspended, color: "text-red-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className={`text-2xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/40 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or country..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/30 shrink-0" />
            {(["all", "active", "pending", "suspended"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors capitalize ${
                  statusFilter === s
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20"
                    : "text-white/40 border border-white/[0.06] hover:text-white/70"
                }`}
              >
                {s} {s !== "all" && `(${counts[s]})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Organization
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Type / Tier
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Contacts
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Certs
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-white/30">
                    Joined
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-sm text-white/30">
                      No organizations match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((org) => {
                  const status = STATUS_CONFIG[org.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={org.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                            <Building className="h-4 w-4 text-white/30" />
                          </div>
                          <span className="text-sm font-medium text-white">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-white/60">{org.type}</span>
                          <span className={`text-xs font-medium ${TIER_COLORS[org.tier]}`}>
                            {org.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                          <Globe className="h-3.5 w-3.5 text-white/20" />
                          {org.country}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                          <Users className="h-3.5 w-3.5 text-white/20" />
                          {org.contacts}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                          <Award className="h-3.5 w-3.5 text-white/20" />
                          {org.certifications}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-white/30">
                        {new Date(org.joinedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            title="View organization"
                            className="rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            title="More options"
                            className="rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs text-white/30">
              Showing {filtered.length} of {mockOrgs.length} organizations
            </span>
            <span className="text-xs text-white/20">Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
