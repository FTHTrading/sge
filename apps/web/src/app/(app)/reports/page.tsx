import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  FileText,
  Globe2,
  Zap,
  Users,
} from "lucide-react";

const reportTemplates = [
  { id: "rpt-001", name: "Ecosystem Overview", description: "Complete partner, project, and deployment summary with KPI trends.", frequency: "Monthly", lastGenerated: "2024-03-01" },
  { id: "rpt-002", name: "Energy Production Report", description: "Aggregated energy production, efficiency, and uptime across all deployments.", frequency: "Weekly", lastGenerated: "2024-03-14" },
  { id: "rpt-003", name: "Standards Compliance Report", description: "Certification status, submission pipeline, and compliance gap analysis.", frequency: "Quarterly", lastGenerated: "2024-01-15" },
  { id: "rpt-004", name: "Governance Activity Report", description: "Proposal activity, voting patterns, and resolution outcomes.", frequency: "Monthly", lastGenerated: "2024-03-01" },
  { id: "rpt-005", name: "Audit Trail Export", description: "Full audit chain export with hash verification for compliance and regulatory use.", frequency: "On-demand", lastGenerated: "2024-03-10" },
  { id: "rpt-006", name: "Partner Performance Report", description: "Individual partner metrics, milestone progress, and tier alignment.", frequency: "Quarterly", lastGenerated: "2024-01-15" },
];

const recentReports = [
  { name: "Ecosystem Overview — March 2024", type: "ecosystem", date: "2024-03-01", size: "2.4 MB", format: "PDF" },
  { name: "Energy Production — W11 2024", type: "energy", date: "2024-03-14", size: "1.1 MB", format: "PDF" },
  { name: "Audit Trail Export — Q1 2024", type: "audit", date: "2024-03-10", size: "18.7 MB", format: "JSON" },
  { name: "Governance Activity — Feb 2024", type: "governance", date: "2024-03-01", size: "890 KB", format: "PDF" },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm text-white/40 mt-1">
          Generate, schedule, and export platform reports and analytics.
        </p>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-[10px] text-white/25 uppercase tracking-wider">
                  {template.frequency}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{template.name}</h3>
              <p className="text-xs text-white/40 leading-relaxed mb-4">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">
                  Last: {template.lastGenerated}
                </span>
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/10 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-600/20 transition-colors">
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-4">Recent Reports</h2>
        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Report</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Size</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30">Format</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-white/30"></th>
              </tr>
            </thead>
            <tbody>
              {recentReports.map((report, i) => (
                <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-white/20" />
                      <span className="text-sm text-white/70">{report.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-white/40">{report.date}</td>
                  <td className="px-5 py-4 text-xs text-white/40">{report.size}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40">
                      {report.format}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="rounded-md p-1.5 text-white/20 hover:bg-white/[0.04] hover:text-white/50 transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
