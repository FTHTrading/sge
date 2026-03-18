import {
  Shield,
  Plus,
  Search,
  Filter,
  FileText,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";

const standards = [
  { id: "std-001", code: "SGE-STD-001", title: "Solar Deployment Efficiency", version: "2.1", clauses: 8, status: "published", certifications: 48, lastUpdated: "2024-02-15" },
  { id: "std-002", code: "SGE-STD-002", title: "Wind Turbine Operations", version: "1.3", clauses: 6, status: "published", certifications: 32, lastUpdated: "2024-01-20" },
  { id: "std-003", code: "SGE-STD-003", title: "Battery Storage Safety", version: "3.0", clauses: 12, status: "published", certifications: 56, lastUpdated: "2024-03-01" },
  { id: "std-004", code: "SGE-STD-004", title: "Grid Integration Protocol", version: "1.1", clauses: 5, status: "published", certifications: 22, lastUpdated: "2023-11-10" },
  { id: "std-005", code: "SGE-STD-005", title: "Carbon Offset Verification", version: "2.1", clauses: 10, status: "published", certifications: 67, lastUpdated: "2024-02-28" },
  { id: "std-006", code: "SGE-STD-006", title: "Community Impact Assessment", version: "1.0", clauses: 7, status: "published", certifications: 41, lastUpdated: "2023-09-15" },
  { id: "std-007", code: "SGE-STD-025", title: "Hybrid Storage Protocol", version: "1.0", clauses: 9, status: "draft", certifications: 0, lastUpdated: "2024-03-15" },
];

const submissions = [
  { id: "sub-001", partner: "SunVolt Energy", standard: "SGE-STD-001", status: "approved", submittedDate: "2024-01-15" },
  { id: "sub-002", partner: "SolarGrid Corp", standard: "SGE-STD-005", status: "approved", submittedDate: "2024-02-01" },
  { id: "sub-003", partner: "WindStream Global", standard: "SGE-STD-002", status: "under_review", submittedDate: "2024-03-10" },
  { id: "sub-004", partner: "GreenPeak Solutions", standard: "SGE-STD-003", status: "under_review", submittedDate: "2024-03-12" },
  { id: "sub-005", partner: "NorthWind Systems", standard: "SGE-STD-004", status: "revision_requested", submittedDate: "2024-02-20" },
];

const subStatusColors: Record<string, string> = {
  approved: "bg-emerald-500/10 text-emerald-400",
  under_review: "bg-blue-500/10 text-blue-400",
  revision_requested: "bg-amber-500/10 text-amber-400",
  rejected: "bg-red-500/10 text-red-400",
  submitted: "bg-purple-500/10 text-purple-400",
};

export default function StandardsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Standards</h1>
          <p className="text-sm text-white/40 mt-1">
            Define and manage sustainability standards and certifications.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          New Standard
        </button>
      </div>

      {/* Standards list */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Published Standards</h2>
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Code</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Title</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Version</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Clauses</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Certifications</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Status</th>
              </tr>
            </thead>
            <tbody>
              {standards.map((std) => (
                <tr key={std.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-4">
                    <code className="text-xs font-mono text-emerald-400">{std.code}</code>
                  </td>
                  <td className="px-5 py-4 text-sm text-white/70">{std.title}</td>
                  <td className="px-5 py-4 text-xs text-white/40">v{std.version}</td>
                  <td className="px-5 py-4 text-xs text-white/40">{std.clauses}</td>
                  <td className="px-5 py-4 text-sm font-medium text-white/60">{std.certifications}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        std.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {std.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certification Submissions */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Recent Submissions</h2>
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/[0.03] flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white/20" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{sub.partner}</p>
                  <p className="text-xs text-white/30">{sub.standard} — Submitted {sub.submittedDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${subStatusColors[sub.status]}`}>
                  {sub.status.replace("_", " ")}
                </span>
                <button className="rounded-md p-1.5 text-white/20 hover:bg-white/[0.04] hover:text-white/50 transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
