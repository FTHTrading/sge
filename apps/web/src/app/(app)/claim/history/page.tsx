"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Wallet,
} from "lucide-react";
import { explorerTxUrl, shortenAddress } from "@/lib/claim";

interface ClaimRecord {
  id: string;
  walletAddress: string;
  tokenSymbol: string;
  amountHuman: number;
  status: string;
  approveTxHash: string | null;
  claimTxHash: string | null;
  claimedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  claim_confirmed: { icon: CheckCircle2, color: "text-emerald-400", label: "Confirmed" },
  initiated: { icon: Clock, color: "text-amber-400", label: "Initiated" },
  approval_pending: { icon: Loader2, color: "text-blue-400", label: "Approval Pending" },
  approval_confirmed: { icon: Clock, color: "text-blue-400", label: "Approved" },
  claim_submitted: { icon: Loader2, color: "text-emerald-400", label: "Claim Submitted" },
  failed: { icon: XCircle, color: "text-red-400", label: "Failed" },
  reverted: { icon: XCircle, color: "text-red-400", label: "Reverted" },
};

export default function ClaimHistoryPage() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/claim?limit=50")
      .then((r) => r.json())
      .then((data) => setClaims(data.claims ?? []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Claim History</h1>
        <p className="text-sm text-white/40 mt-1">
          All token claim transactions recorded in the system.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30">
            <Wallet className="w-10 h-10 mb-3" />
            <p className="text-sm">No claims recorded yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-xs text-white/30 uppercase tracking-wider">
                <th className="text-left px-6 py-3">Wallet</th>
                <th className="text-left px-6 py-3">Token</th>
                <th className="text-right px-6 py-3">Amount</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Tx</th>
                <th className="text-left px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {claims.map((claim) => {
                const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.initiated!;
                const Icon = cfg.icon;
                return (
                  <tr key={claim.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-mono text-white/60">
                      {shortenAddress(claim.walletAddress)}
                    </td>
                    <td className="px-6 py-4 text-white/60">{claim.tokenSymbol}</td>
                    <td className="px-6 py-4 text-right text-white font-medium">
                      {claim.amountHuman}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {claim.claimTxHash ? (
                        <a
                          href={explorerTxUrl(claim.claimTxHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-400 transition"
                        >
                          {claim.claimTxHash.slice(0, 10)}…
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-white/30">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
