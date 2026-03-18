import {
  Gift,
  Plus,
  Search,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

const plans = [
  { id: "inc-001", name: "Early Adopter Program", type: "milestone_based", status: "active", partners: 24, conditions: 5, completedConditions: 3 },
  { id: "inc-002", name: "Regional Expansion Bonus", type: "milestone_based", status: "active", partners: 12, conditions: 3, completedConditions: 1 },
  { id: "inc-003", name: "Standards Compliance Reward", type: "certification_based", status: "active", partners: 45, conditions: 2, completedConditions: 2 },
  { id: "inc-004", name: "Governance Participation Credit", type: "activity_based", status: "active", partners: 180, conditions: 4, completedConditions: 2 },
  { id: "inc-005", name: "Q1 Deployment Accelerator", type: "milestone_based", status: "completed", partners: 8, conditions: 6, completedConditions: 6 },
  { id: "inc-006", name: "Carbon Offset Premium", type: "certification_based", status: "draft", partners: 0, conditions: 3, completedConditions: 0 },
];

const typeLabels: Record<string, string> = {
  milestone_based: "Milestone-Based",
  certification_based: "Certification-Based",
  activity_based: "Activity-Based",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-white/10 text-white/60",
  draft: "bg-gray-500/10 text-gray-400",
  paused: "bg-amber-500/10 text-amber-400",
};

export default function IncentivesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Incentive Plans</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage conditional incentive programs and track condition fulfillment.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search plans..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center">
                <Gift className="h-5 w-5 text-emerald-400" />
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[plan.status]}`}>
                {plan.status}
              </span>
            </div>

            <h3 className="text-base font-semibold text-white mb-1">{plan.name}</h3>
            <p className="text-xs text-white/30 mb-4">{typeLabels[plan.type]}</p>

            <div className="flex items-center gap-4 text-xs text-white/30">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {plan.partners} partners
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/25">
                  Conditions: {plan.completedConditions}/{plan.conditions}
                </span>
                <span className="text-[10px] font-semibold text-white/40">
                  {plan.conditions > 0
                    ? Math.round((plan.completedConditions / plan.conditions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${plan.conditions > 0 ? (plan.completedConditions / plan.conditions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
