"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  DollarSign,
  Pause,
  Play,
  RefreshCw,
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Copy,
  PieChart,
} from "lucide-react";
import { SGE_CONFIG, explorerAddressUrl, explorerTxUrl } from "@/lib/config/sge";
import { DEFAULT_ALLOCATION, LEG_LABELS } from "@/lib/settlement/types";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function AdminSGEPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="ml-2 text-white/20 hover:text-emerald-400 transition"
      title="Copy"
    >
      {copied === id ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">SGE Configuration</h1>
        <p className="text-sm text-white/40 mt-1">
          Contract addresses, token settings, allocation percentages, and settlement configuration.
        </p>
      </div>

      {/* Contract Info */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <Shield className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Claim Contract</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Contract Address
              </label>
              <div className="flex items-center">
                <a
                  href={explorerAddressUrl(SGE_CONFIG.claimContract)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-emerald-400/80 hover:text-emerald-400 transition flex items-center gap-1"
                >
                  {SGE_CONFIG.claimContract}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <CopyBtn text={SGE_CONFIG.claimContract} id="contract" />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Chain
              </label>
              <span className="text-sm text-white/60">Ethereum Mainnet (Chain ID: {SGE_CONFIG.chainId})</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Claim Amount
              </label>
              <span className="text-lg font-bold text-white">{SGE_CONFIG.claimAmountHuman}</span>
              <span className="text-sm text-white/30 ml-1">USDC / USDT</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                SGE Reward
              </label>
              <span className="text-lg font-bold text-emerald-400">{SGE_CONFIG.sgeReward.toLocaleString()}</span>
              <span className="text-sm text-white/30 ml-1">SGE tokens</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Raw Amount (6 decimals)
              </label>
              <span className="text-sm text-white/40 font-mono">{SGE_CONFIG.claimAmountRaw}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Tokens */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Supported Payment Tokens</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {(Object.entries(SGE_CONFIG.tokens) as [string, { address: string; decimals: number; name: string }][]).map(
              ([symbol, info]) => (
                <div
                  key={symbol}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">{symbol}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/20">
                      {info.decimals} decimals
                    </span>
                  </div>
                  <div className="text-xs text-white/30 mb-1">{info.name}</div>
                  <div className="flex items-center">
                    <a
                      href={explorerAddressUrl(info.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-white/40 hover:text-emerald-400 transition flex items-center gap-1"
                    >
                      {shortenAddress(info.address)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <CopyBtn text={info.address} id={`token-${symbol}`} />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Settlement Allocation */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <PieChart className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Settlement Allocation</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {([
              { leg: "treasury", pct: DEFAULT_ALLOCATION.treasuryPercent },
              { leg: "reserve", pct: DEFAULT_ALLOCATION.reservePercent },
              { leg: "fee", pct: DEFAULT_ALLOCATION.feePercent },
              { leg: "community", pct: DEFAULT_ALLOCATION.communityPercent },
            ] as const).map(({ leg, pct }) => {
              const label = (LEG_LABELS as Record<string, string>)[leg] ?? leg;
              const colors: Record<string, string> = {
                treasury: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
                reserve: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                fee: "text-amber-400 bg-amber-500/10 border-amber-500/20",
                community: "text-purple-400 bg-purple-500/10 border-purple-500/20",
              };
              const colorCls = colors[leg] ?? "text-white/60 bg-white/5 border-white/10";
              return (
                <div
                  key={leg}
                  className={`rounded-lg border p-4 ${colorCls}`}
                >
                  <div className="text-2xl font-bold">{pct}%</div>
                  <div className="text-xs mt-1 opacity-70">{label}</div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-white/20 mt-3">
            Allocation legs sum to 100%. Remainder from integer rounding is always assigned to treasury.
          </p>
        </div>
      </section>

      {/* Reconciliation Settings */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <RefreshCw className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Reconciliation</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Confirmations Required
              </label>
              <span className="text-sm text-white/60">{SGE_CONFIG.reconciliation.confirmations} blocks</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Polling Interval
              </label>
              <span className="text-sm text-white/60">{SGE_CONFIG.reconciliation.pollIntervalMs / 1000}s</span>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-white/30 mb-1 block">
                Receipt Timeout
              </label>
              <span className="text-sm text-white/60">{SGE_CONFIG.reconciliation.txTimeoutMs / 1000}s</span>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnostics Notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-400/80">
          <strong className="text-amber-400">Admin actions</strong> such as funding the contract with SGE tokens,
          transferring ownership, or replaying reconciliation require owner wallet signature and are
          executed directly through the contract. Use the{" "}
          <a
            href={explorerAddressUrl(SGE_CONFIG.claimContract) + "#writeContract"}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-300 transition"
          >
            Etherscan Write Contract
          </a>{" "}
          interface or a trusted multisig.
        </div>
      </div>
    </div>
  );
}
