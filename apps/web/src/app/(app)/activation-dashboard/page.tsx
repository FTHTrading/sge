"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  CheckCircle2,
  Clock,
  Gift,
  Zap,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  Shield,
} from "lucide-react";
import { SGE_CONFIG, type SGETokenSymbol, explorerTxUrl, explorerAddressUrl } from "@/lib/config/sge";
import { DEMO_MODE } from "@/lib/config/demo";
import { type ActivationRecord, type MonthlyClaimRecord, loadActivationRecord } from "@/lib/activation-store";

// ── Generate monthly schedule ───────────────

function generateMonthlySchedule(activationDate: string): MonthlyClaimRecord[] {
  const start = new Date(activationDate);
  const now = new Date();
  const schedule: MonthlyClaimRecord[] = [];

  for (let i = 1; i <= 12; i++) {
    const claimDate = new Date(start);
    claimDate.setMonth(claimDate.getMonth() + i);
    claimDate.setDate(1);

    let status: MonthlyClaimRecord["status"] = "upcoming";
    if (claimDate <= now) {
      status = "available"; // Past months are available
    }
    if (i > 6) {
      status = "locked"; // Future months placeholder
    }

    schedule.push({
      month: i,
      amount: 100,
      status,
      claimDate: claimDate.toISOString(),
      txHash: null,
    });
  }

  return schedule;
}

// ── Dashboard Page ──────────────────────────

export default function ActivationDashboardPage() {
  const [record, setRecord] = useState<ActivationRecord | null>(null);
  const [schedule, setSchedule] = useState<MonthlyClaimRecord[]>([]);

  useEffect(() => {
    const stored = loadActivationRecord();
    if (stored) {
      setRecord(stored);
      setSchedule(generateMonthlySchedule(stored.timestamp));
    } else if (DEMO_MODE) {
      // Generate demo record
      const demoRecord: ActivationRecord = {
        wallet: "0x1FF7251B479818d0529b65d89AD314E47E5DA922",
        token: "USDC",
        amountPaid: 100,
        sgeReceived: 1000,
        claimTxHash: "0xdemo_claim_f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
        approveTxHash: "0xdemo_approve_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
        blockNumber: 19_500_000,
        timestamp: new Date().toISOString(),
        activated: true,
      };
      setRecord(demoRecord);
      setSchedule(generateMonthlySchedule(demoRecord.timestamp));
    }
  }, []);

  if (!record) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Activation Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Your activation and reward status</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-4">No activation record found.</p>
          <Link
            href="/activate"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-400 transition"
          >
            <Zap className="w-4 h-4" />
            Activate Now
          </Link>
        </div>
      </div>
    );
  }

  const totalRewardsScheduled = schedule.reduce((s, m) => s + m.amount, 0);
  const totalClaimed = schedule.filter((m) => m.status === "claimed").reduce((s, m) => s + m.amount, 0);
  const nextAvailable = schedule.find((m) => m.status === "available" || m.status === "upcoming");

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Activation Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">
          Foundation position status and reward tracking
        </p>
        {DEMO_MODE && (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            Demo Mode
          </div>
        )}
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <Shield className="w-4 h-4 text-emerald-400 mb-2" />
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Status</div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-lg font-bold text-emerald-400">Activated</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
          <Zap className="w-4 h-4 text-white/25 mb-2" />
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">SGE Received</div>
          <div className="text-lg font-bold text-white">{record.sgeReceived.toLocaleString()}</div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
          <Gift className="w-4 h-4 text-white/25 mb-2" />
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Rewards Scheduled</div>
          <div className="text-lg font-bold text-white">{totalRewardsScheduled.toLocaleString()} SGE</div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
          <TrendingUp className="w-4 h-4 text-white/25 mb-2" />
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">Claimed</div>
          <div className="text-lg font-bold text-white">{totalClaimed} SGE</div>
        </div>
      </div>

      {/* Activation record */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Activation Receipt
        </h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/30 text-xs mb-1">Wallet Address</div>
            <a
              href={explorerAddressUrl(record.wallet)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-mono text-xs hover:text-emerald-400 transition flex items-center gap-1"
            >
              {record.wallet.slice(0, 6)}…{record.wallet.slice(-4)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Contribution Token</div>
            <div className="text-white font-medium">{record.token}</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Contribution Amount</div>
            <div className="text-white font-medium">{record.amountPaid} {record.token}</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">SGE Received</div>
            <div className="text-emerald-400 font-bold">{record.sgeReceived.toLocaleString()} SGE</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Block Number</div>
            <div className="text-white font-mono text-xs">{record.blockNumber.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-white/30 text-xs mb-1">Activation Date</div>
            <div className="text-white text-xs">
              {new Date(record.timestamp).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* TX links */}
        <div className="pt-3 border-t border-white/[0.06] space-y-2">
          {record.approveTxHash && (
            <a
              href={explorerTxUrl(record.approveTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-emerald-400 transition"
            >
              <Clock className="w-3 h-3" />
              Approval Tx: {record.approveTxHash.slice(0, 20)}…
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <a
            href={explorerTxUrl(record.claimTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-white/40 hover:text-emerald-400 transition"
          >
            <CheckCircle2 className="w-3 h-3" />
            Claim Tx: {record.claimTxHash.slice(0, 20)}…
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Monthly reward schedule */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-400" />
          Monthly Reward Schedule
        </h2>

        <div className="space-y-2">
          {schedule.map((m) => (
            <div
              key={m.month}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${
                    m.status === "claimed"
                      ? "bg-emerald-500"
                      : m.status === "available"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-white/10"
                  }`}
                />
                <div>
                  <div className="text-sm text-white/70">Month {m.month}</div>
                  <div className="text-xs text-white/30">
                    {m.claimDate
                      ? new Date(m.claimDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <span className="text-sm font-medium text-white/60">{m.amount} SGE</span>
                {m.status === "claimed" ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Claimed
                  </span>
                ) : m.status === "available" ? (
                  <button
                    disabled
                    className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-md border border-emerald-500/20 cursor-not-allowed"
                  >
                    Claim
                  </button>
                ) : (
                  <span className="text-xs text-white/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {m.status === "locked" ? "Locked" : "Upcoming"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-white/20 text-center pt-2">
          100 SGE per month for 12 months. Eligibility based on activation date and configured reward schedule.
        </div>
      </div>
    </div>
  );
}
