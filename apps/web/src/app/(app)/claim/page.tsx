"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Wallet,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Coins,
  ShieldCheck,
  Clock,
  Ban,
  CircleDot,
} from "lucide-react";
import {
  type ClaimState,
  INITIAL_CLAIM_STATE,
  runClaimFlow,
  shortenAddress,
} from "@/lib/web3/sgeClaim";
import { SGE_CONFIG, type SGETokenSymbol, explorerTxUrl } from "@/lib/config/sge";
import { DEMO_MODE } from "@/lib/config/demo";
import {
  type ReadinessResult,
  type BlockReason,
  checkReadiness,
  blockReasonLabel,
  MIN_CONTRACT_SGE,
} from "@/lib/web3/readiness";

/* ──────────────── STATUS LABELS ────────────────── */

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

/* ──────────────── HELPERS ────────────────── */

function formatBigintEth(wei: bigint): string {
  const eth = Number(wei) / 1e18;
  return eth.toFixed(4);
}

function formatBigintStable(raw: bigint): string {
  const human = Number(raw) / 1e6;
  return human.toFixed(2);
}

function formatBigintSge(raw: bigint): string {
  const human = Number(raw) / 1e18;
  return human.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/* ──────────────── PAGE ────────────────── */

export default function ClaimPage() {
  const [state, setState] = useState<ClaimState>(INITIAL_CLAIM_STATE);
  const [selectedToken, setSelectedToken] = useState<SGETokenSymbol>("USDC");
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  const isProcessing = !["idle", "confirmed", "failed"].includes(state.step);

  // Run readiness check on mount and when token changes (live mode only)
  useEffect(() => {
    if (DEMO_MODE) return;
    let cancelled = false;
    setReadinessLoading(true);
    checkReadiness(selectedToken)
      .then((r) => { if (!cancelled) setReadiness(r); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReadinessLoading(false); });
    return () => { cancelled = true; };
  }, [selectedToken]);

  // Determine if claim should be blocked
  const isContractDrained = readiness ? readiness.blocked.includes("contract_drained") : false;
  const isAlreadyClaimed = readiness ? readiness.blocked.includes("already_claimed") : false;
  const canClaim = DEMO_MODE || (readiness?.ready ?? false);

  const handleClaim = useCallback(async () => {
    setState({ ...INITIAL_CLAIM_STATE, selectedToken });
    try {
      await runClaimFlow(selectedToken, (partial) => {
        setState((prev) => ({ ...prev, ...partial }));
      });
    } catch {
      // Error already set via onProgress callback
    }
  }, [selectedToken]);

  const handleReset = () => setState(INITIAL_CLAIM_STATE);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Claim SGE Tokens</h1>
        <p className="text-sm text-white/40 mt-1">
          Participate in the SGE ecosystem — claim your allocation using USDC or USDT.
        </p>
      </div>

      {/* ── CLAIM CARD ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-8">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-sm text-white/60">
            <span className="text-emerald-400 font-medium">Ethereum Mainnet only.</span>{" "}
            Each wallet may claim once. You will approve a{" "}
            <span className="text-white font-medium">{SGE_CONFIG.claimAmountHuman} {selectedToken}</span>{" "}
            transfer, then receive{" "}
            <span className="text-white font-medium">{SGE_CONFIG.sgeReward.toLocaleString()} SGE</span>{" "}
            tokens.
          </div>
        </div>

        {/* ── CONTRACT STATUS BANNER (live mode only) ── */}
        {!DEMO_MODE && readiness && (
          <div className={`flex items-start gap-3 rounded-lg border p-4 mb-4 ${
            isContractDrained
              ? "border-red-500/30 bg-red-500/5"
              : "border-emerald-500/20 bg-emerald-500/5"
          }`}>
            {isContractDrained ? (
              <>
                <Ban className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="text-red-400 font-semibold">DRAINED — NOT ACCEPTING CLAIMS</span>
                  <p className="text-white/40 mt-1">
                    Contract SGE balance: {formatBigintSge(readiness.data.contractSgeBalance)} SGE.
                    Claims will revert until the contract is re-funded.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CircleDot className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="text-emerald-400 font-semibold">LIVE — FUNDED</span>
                  <p className="text-white/40 mt-1">
                    Contract SGE balance: {formatBigintSge(readiness.data.contractSgeBalance)} SGE
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── WALLET BALANCES (live mode only) ── */}
        {!DEMO_MODE && readiness && readiness.data.wallet && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mb-4">
            <div className="text-xs uppercase tracking-wider text-white/30 mb-3">Wallet Balances</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-white/30 text-xs">ETH</div>
                <div className={`font-mono ${readiness.blocked.includes("no_gas") ? "text-red-400" : "text-white"}`}>
                  {formatBigintEth(readiness.data.ethBalance)}
                </div>
              </div>
              <div>
                <div className="text-white/30 text-xs">USDC</div>
                <div className={`font-mono ${readiness.blocked.includes("insufficient_usdc") ? "text-red-400" : "text-white"}`}>
                  {formatBigintStable(readiness.data.usdcBalance)}
                </div>
              </div>
              <div>
                <div className="text-white/30 text-xs">USDT</div>
                <div className={`font-mono ${readiness.blocked.includes("insufficient_usdt") ? "text-red-400" : "text-white"}`}>
                  {formatBigintStable(readiness.data.usdtBalance)}
                </div>
              </div>
            </div>
            {readiness.blocked.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.04] space-y-1">
                {readiness.blocked.map((reason) => (
                  <div key={reason} className="text-xs text-red-400/80 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3 shrink-0" />
                    {blockReasonLabel(reason)}
                  </div>
                ))}
              </div>
            )}
            {readiness.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {readiness.warnings.map((w, i) => (
                  <div key={i} className="text-xs text-amber-400/70 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── READINESS LOADING ── */}
        {!DEMO_MODE && readinessLoading && (
          <div className="flex items-center gap-2 text-xs text-white/30 mb-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Checking on-chain readiness…
          </div>
        )}

        {/* Token selector */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wider text-white/30 mb-3">
            Select Payment Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(SGE_CONFIG.tokens) as SGETokenSymbol[]).map((symbol) => (
              <button
                key={symbol}
                disabled={isProcessing}
                onClick={() => setSelectedToken(symbol)}
                className={`
                  flex items-center gap-3 rounded-lg border p-4 transition
                  ${selectedToken === symbol
                    ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                    : "border-white/[0.06] bg-white/[0.01] text-white/50 hover:border-white/10 hover:text-white/70"
                  }
                  ${isProcessing ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                `}
              >
                <Coins className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">{symbol}</div>
                  <div className="text-xs text-white/30">{SGE_CONFIG.tokens[symbol].symbol}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount summary */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
          <div className="text-center">
            <div className="text-xs text-white/30 uppercase tracking-wider mb-1">You Pay</div>
            <div className="text-lg font-bold text-white">{SGE_CONFIG.claimAmountHuman} {selectedToken}</div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400" />
          <div className="text-center">
            <div className="text-xs text-white/30 uppercase tracking-wider mb-1">You Receive</div>
            <div className="text-lg font-bold text-emerald-400">{SGE_CONFIG.sgeReward.toLocaleString()} SGE</div>
          </div>
        </div>

        {/* Wallet display */}
        {state.walletAddress && (
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-6">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-white/60">
              Connected: <span className="text-white font-mono">{shortenAddress(state.walletAddress)}</span>
            </span>
          </div>
        )}

        {/* Progress indicator */}
        {state.step !== "idle" && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
            <div className="flex items-center gap-3">
              {state.step === "confirmed" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : state.step === "failed" ? (
                <XCircle className="w-5 h-5 text-red-400 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
              )}
              <div>
                <div className={`text-sm font-medium ${
                  state.step === "confirmed" ? "text-emerald-400" :
                  state.step === "failed" ? "text-red-400" : "text-white"
                }`}>
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
        )}

        {/* Action button */}
        {state.step === "confirmed" ? (
          <button
            onClick={handleReset}
            className="w-full rounded-lg bg-white/5 border border-white/[0.06] px-6 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            Done — Return to Dashboard
          </button>
        ) : state.step === "failed" ? (
          <button
            onClick={handleClaim}
            className="w-full rounded-lg bg-red-500/20 border border-red-500/30 px-6 py-3 text-sm font-medium text-red-300 hover:bg-red-500/30 transition"
          >
            Retry Claim
          </button>
        ) : (
          <button
            onClick={handleClaim}
            disabled={isProcessing || !canClaim}
            className={`
              w-full rounded-lg px-6 py-3 text-sm font-medium transition
              ${isProcessing || !canClaim
                ? "bg-emerald-500/20 border border-emerald-500/20 text-emerald-400/60 cursor-not-allowed"
                : "bg-emerald-500 border border-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
              }
            `}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing…
              </span>
            ) : !canClaim && !DEMO_MODE ? (
              <span className="flex items-center justify-center gap-2">
                <Ban className="w-4 h-4" />
                {isContractDrained ? "Contract Not Funded" : isAlreadyClaimed ? "Already Claimed" : "Not Ready — See Above"}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Wallet className="w-4 h-4" />
                Claim {SGE_CONFIG.sgeReward.toLocaleString()} SGE for {SGE_CONFIG.claimAmountHuman} {selectedToken}
              </span>
            )}
          </button>
        )}
      </div>

      {/* ── IMPORTANT NOTICES ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Important Information</h2>
        <div className="space-y-3 text-xs text-white/40 leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span>
              SGE tokens represent participation in the SGE ecosystem and its governance framework.
              They are <span className="text-white/60">not an investment product</span> and carry no
              guarantee of financial return.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span>
              Each wallet address may claim only once. The claim contract enforces this on-chain.
              Ensure you are connected to the wallet you intend to use.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <span>
              This transaction occurs on <span className="text-white/60">Ethereum Mainnet</span>.
              You will need ETH for gas fees. Token approval and claim are separate transactions.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
