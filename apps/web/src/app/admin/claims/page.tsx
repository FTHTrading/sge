"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface ClaimSummary {
  total: number;
  confirmed: number;
  failed: number;
  pending: number;
  claims: Array<{
    id: string;
    walletAddress: string;
    tokenSymbol: string;
    amountHuman: number;
    status: string;
    claimTxHash: string | null;
    claimedAt: string | null;
    createdAt: string;
  }>;
}

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
  claim_confirmed: { color: "bg-emerald-500/20 text-emerald-400", label: "Confirmed" },
  initiated: { color: "bg-amber-500/20 text-amber-400", label: "Initiated" },
  approval_pending: { color: "bg-blue-500/20 text-blue-400", label: "Approval Pending" },
  approval_confirmed: { color: "bg-blue-500/20 text-blue-400", label: "Approved" },
  claim_submitted: { color: "bg-emerald-500/20 text-emerald-400/70", label: "Submitted" },
  failed: { color: "bg-red-500/20 text-red-400", label: "Failed" },
  reverted: { color: "bg-red-500/20 text-red-400", label: "Reverted" },
};

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminClaimsPage() {
  const [data, setData] = useState<ClaimSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClaims = () => {
    setLoading(true);
    fetch("/api/claim?limit=100")
      .then((r) => r.json())
      .then((res) => {
        const claims = res.claims ?? [];
        setData({
          total: res.total ?? claims.length,
          confirmed: claims.filter((c: any) => c.status === "claim_confirmed").length,
          failed: claims.filter((c: any) => c.status === "failed" || c.status === "reverted").length,
          pending: claims.filter((c: any) => !["claim_confirmed", "failed", "reverted"].includes(c.status)).length,
          claims,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Claim Administration</h1>
          <p className="text-sm text-white/40 mt-1">
            Monitor and manage SGE token claim transactions.
          </p>
        </div>
        <button
          onClick={fetchClaims}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-white/30">Failed to load claim data.</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Claims", value: data.total, icon: Wallet, color: "text-white" },
              { label: "Confirmed", value: data.confirmed, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Pending", value: data.pending, icon: Clock, color: "text-amber-400" },
              { label: "Failed", value: data.failed, icon: XCircle, color: "text-red-400" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
                <div className="flex items-center justify-between mb-4">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <TrendingUp className="w-4 h-4 text-white/10" />
                </div>
                <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-white/30 mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Claims table */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-white/30 uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Wallet</th>
                  <th className="text-left px-6 py-3">Token</th>
                  <th className="text-right px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Tx Hash</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {data.claims.map((claim) => {
                  const badge = STATUS_BADGE[claim.status] ?? STATUS_BADGE.initiated!;
                  return (
                    <tr key={claim.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 font-mono text-white/60 text-xs">
                        {shortenAddress(claim.walletAddress)}
                      </td>
                      <td className="px-6 py-4 text-white/60">{claim.tokenSymbol}</td>
                      <td className="px-6 py-4 text-right text-white font-medium">{claim.amountHuman}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {claim.claimTxHash ? (
                          <a
                            href={`https://etherscan.io/tx/${claim.claimTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-400 transition text-xs font-mono"
                          >
                            {claim.claimTxHash.slice(0, 12)}…
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-white/15">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-white/30 text-xs">
                        {new Date(claim.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
