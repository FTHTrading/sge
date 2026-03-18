import {
  Scale,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Vote,
  FileText,
  Users,
} from "lucide-react";

const proposals = [
  {
    id: "GOV-2024-048",
    title: "Establish Regional Advisory Councils",
    type: "governance_policy",
    status: "voting",
    proposer: "SunVolt Energy",
    votesFor: 98,
    votesAgainst: 12,
    quorum: 60,
    totalVoters: 180,
    deadline: "2024-04-01",
  },
  {
    id: "GOV-2024-049",
    title: "Add Energy Storage Requirements to STD-001",
    type: "standard_amendment",
    status: "voting",
    proposer: "NorthWind Systems",
    votesFor: 72,
    votesAgainst: 8,
    quorum: 60,
    totalVoters: 180,
    deadline: "2024-04-05",
  },
  {
    id: "GOV-2024-050",
    title: "Increase Minimum Deployment Efficiency to 90%",
    type: "standard_amendment",
    status: "discussion",
    proposer: "GreenPeak Solutions",
    votesFor: 0,
    votesAgainst: 0,
    quorum: 60,
    totalVoters: 180,
    deadline: "2024-04-15",
  },
  {
    id: "GOV-2024-047",
    title: "Expand Solar Standards to Bifacial Panels",
    type: "standard_amendment",
    status: "approved",
    proposer: "SolarGrid Corp",
    votesFor: 142,
    votesAgainst: 22,
    quorum: 60,
    totalVoters: 180,
    deadline: "2024-03-15",
  },
  {
    id: "GOV-2024-046",
    title: "Update Carbon Offset Methodology v2.1",
    type: "standard_amendment",
    status: "approved",
    proposer: "SGE Standards Committee",
    votesFor: 158,
    votesAgainst: 14,
    quorum: 60,
    totalVoters: 180,
    deadline: "2024-03-10",
  },
  {
    id: "GOV-2024-044",
    title: "Increase Quorum for Policy Changes to 80%",
    type: "governance_policy",
    status: "rejected",
    proposer: "AquaPower Ltd",
    votesFor: 89,
    votesAgainst: 76,
    quorum: 75,
    totalVoters: 180,
    deadline: "2024-03-05",
  },
];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  draft: { color: "bg-gray-500/10 text-gray-400", icon: FileText, label: "Draft" },
  discussion: { color: "bg-blue-500/10 text-blue-400", icon: Users, label: "Discussion" },
  voting: { color: "bg-purple-500/10 text-purple-400", icon: Vote, label: "Voting" },
  approved: { color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle, label: "Approved" },
  rejected: { color: "bg-red-500/10 text-red-400", icon: XCircle, label: "Rejected" },
  executed: { color: "bg-white/10 text-white/60", icon: CheckCircle, label: "Executed" },
};

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Governance</h1>
          <p className="text-sm text-white/40 mt-1">
            Proposals, voting, and resolutions for ecosystem governance.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          <Plus className="h-4 w-4" />
          New Proposal
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search proposals..."
            className="h-9 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Proposals */}
      <div className="space-y-4">
        {proposals.map((proposal) => {
          const sc = statusConfig[proposal.status] ?? { color: "bg-gray-500/10 text-gray-400", icon: Clock, label: proposal.status };
          const StatusIcon = sc.icon;
          const totalVotes = proposal.votesFor + proposal.votesAgainst;
          const quorumReached = totalVotes >= (proposal.totalVoters * proposal.quorum) / 100;

          return (
            <div
              key={proposal.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono text-emerald-400/70">{proposal.id}</code>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{proposal.title}</h3>
                  <p className="text-xs text-white/30 mt-1">
                    Proposed by {proposal.proposer} — Deadline: {proposal.deadline}
                  </p>
                </div>
              </div>

              {(proposal.status === "voting" || proposal.status === "approved" || proposal.status === "rejected") && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-emerald-400">
                        For: {proposal.votesFor}
                      </span>
                      <span className="text-red-400">
                        Against: {proposal.votesAgainst}
                      </span>
                    </div>
                    <span className="text-[10px] text-white/25">
                      Quorum: {proposal.quorum}% ({quorumReached ? "reached" : "not reached"})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] flex overflow-hidden">
                    {totalVotes > 0 && (
                      <>
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst)) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
