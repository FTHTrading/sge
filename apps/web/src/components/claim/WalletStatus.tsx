"use client";

import { Wallet, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { shortenAddress, isMetaMask } from "@/lib/web3/sgeClaim";
import type { ClaimState } from "@/lib/web3/sgeClaim";

interface Props {
  state: ClaimState;
}

export function WalletStatus({ state }: Props) {
  const metamask = isMetaMask();

  if (!state.walletAddress) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-white/20 animate-pulse" />
        <span className="text-sm text-white/40">
          {metamask ? "MetaMask detected — not connected" : "No wallet detected"}
        </span>
        {!metamask && (
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
          >
            Install MetaMask <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-emerald-400" />
        <span className="text-sm text-white/60">
          Connected:{" "}
          <span className="text-white font-mono">{shortenAddress(state.walletAddress)}</span>
        </span>
      </div>
      {state.alreadyClaimed && (
        <span className="ml-auto flex items-center gap-1 text-xs text-amber-400">
          <AlertTriangle className="w-3 h-3" /> Already claimed
        </span>
      )}
      {state.step === "confirmed" && (
        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Claim successful
        </span>
      )}
      {state.step === "failed" && !state.alreadyClaimed && (
        <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      )}
    </div>
  );
}
