"use client";

import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import type { ClaimState } from "@/lib/web3/sgeClaim";
import { explorerTxUrl } from "@/lib/config/sge";

const STEP_LABELS: Record<ClaimState["step"], string> = {
  idle: "Ready to begin",
  connecting: "Connecting wallet…",
  checking_network: "Verifying Ethereum Mainnet…",
  checking_eligibility: "Checking claim eligibility…",
  checking_balance: "Checking token balance…",
  approving: "Requesting token approval…",
  approval_pending: "Waiting for approval confirmation…",
  claiming: "Submitting claim transaction…",
  claim_pending: "Waiting for claim confirmation…",
  confirmed: "Claim confirmed!",
  failed: "Claim failed",
};

interface Props {
  state: ClaimState;
}

export function ClaimProgress({ state }: Props) {
  if (state.step === "idle") return null;

  const isSuccess = state.step === "confirmed";
  const isFailed = state.step === "failed";

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
      {/* Current step */}
      <div className="flex items-center gap-3">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        ) : isFailed ? (
          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        ) : (
          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
        )}
        <div>
          <div
            className={`text-sm font-medium ${
              isSuccess
                ? "text-emerald-400"
                : isFailed
                ? "text-red-400"
                : "text-white"
            }`}
          >
            {STEP_LABELS[state.step]}
          </div>
          {state.error && (
            <div className="text-xs text-red-400/80 mt-1">{state.error}</div>
          )}
        </div>
      </div>

      {/* Transaction links */}
      {(state.approveTxHash || state.claimTxHash) && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-2">
          {state.approveTxHash && state.approveTxHash !== "already-approved" && (
            <a
              href={explorerTxUrl(state.approveTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-emerald-400 transition"
            >
              <Clock className="w-3 h-3" />
              Approval Tx: {state.approveTxHash.slice(0, 18)}…
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {state.claimTxHash && (
            <a
              href={explorerTxUrl(state.claimTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/40 hover:text-emerald-400 transition"
            >
              <CheckCircle2 className="w-3 h-3" />
              Claim Tx: {state.claimTxHash.slice(0, 18)}…
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
