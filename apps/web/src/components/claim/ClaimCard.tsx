"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Wallet,
  ArrowRight,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

import { SGE_CONFIG, type SGETokenSymbol } from "@/lib/config/sge";
import {
  type ClaimState,
  INITIAL_CLAIM_STATE,
  runClaimFlow,
  checkContractFundedStatus,
} from "@/lib/web3/sgeClaim";
import { WalletStatus } from "@/components/claim/WalletStatus";
import { StablecoinSelector } from "@/components/claim/StablecoinSelector";
import { ClaimProgress } from "@/components/claim/ClaimProgress";

export function ClaimCard() {
  const [state, setState] = useState<ClaimState>(INITIAL_CLAIM_STATE);
  const [selectedToken, setSelectedToken] = useState<SGETokenSymbol>("USDC");
  
  // Drained State tracking
  const [fundingStatus, setFundingStatus] = useState<{ isFunded: boolean, checked: boolean }>({ isFunded: true, checked: false });

  // Preflight check on mount
  useEffect(() => {
    // Only run on browser
    if (typeof window !== "undefined") {
      checkContractFundedStatus().then(res => {
        setFundingStatus({ isFunded: res.isFunded, checked: true });
      });
    }
  }, []);

  const isProcessing = !["idle", "confirmed", "failed"].includes(state.step);

  const handleClaim = useCallback(async () => {
    setState({ ...INITIAL_CLAIM_STATE, selectedToken });
    try {
      await runClaimFlow(selectedToken, (partial) => {
        setState((prev) => ({ ...prev, ...partial }));
      });
    } catch {
      // Error already recorded via onProgress
    }
  }, [selectedToken]);

  const handleReset = () => setState(INITIAL_CLAIM_STATE);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-8 space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
        <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-sm text-white/60">
          <span className="text-emerald-400 font-medium">Ethereum Mainnet only.</span>{" "}
          Each wallet may claim once. You will approve a{" "}
          <span className="text-white font-medium">
            {SGE_CONFIG.claimAmountHuman} {selectedToken}
          </span>{" "}
          transfer, then receive{" "}
          <span className="text-white font-medium">
            {SGE_CONFIG.sgeReward.toLocaleString()} SGE
          </span>{" "}
          tokens.
        </div>
      </div>

      {/* DRAINED BANNER */}
      {fundingStatus.checked && !fundingStatus.isFunded && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm text-red-200">
            <strong className="text-red-400 block mb-1">Claims currently unavailable</strong>
            The SGE Claim Contract is currently drained and has no SGE balance. 
            Claims will automatically resume once the operations team reloads the contract via <code className="text-xs bg-black/40 px-1 py-0.5 rounded text-red-300">fundSGE()</code>.
          </div>
        </div>
      )}

      {/* Wallet status */}
      <WalletStatus state={state} />

      {/* Token selector */}
      <StablecoinSelector
        selected={selectedToken}
        onChange={setSelectedToken}
        disabled={isProcessing}
      />

      {/* Amount summary */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="text-center">
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">
            You Pay
          </div>
          <div className="text-lg font-bold text-white">
            {SGE_CONFIG.claimAmountHuman} {selectedToken}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-emerald-400" />
        <div className="text-center">
          <div className="text-xs text-white/30 uppercase tracking-wider mb-1">
            You Receive
          </div>
          <div className="text-lg font-bold text-emerald-400">
            {SGE_CONFIG.sgeReward.toLocaleString()} SGE
          </div>
        </div>
      </div>

      {/* Progress */}
      <ClaimProgress state={state} />

      {/* Action button */}
      {state.step === "confirmed" ? (
        <div className="space-y-3">
          <button
            onClick={handleReset}
            className="w-full rounded-lg bg-white/5 border border-white/[0.06] px-6 py-3 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition"
          >
            Done — Return to Dashboard
          </button>
          <a
            href="/metamask-card"
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#f6851b]/10 border border-[#f6851b]/20 px-6 py-3 text-sm font-medium text-[#f6851b] hover:bg-[#f6851b]/20 transition"
          >
            <CreditCard className="w-4 h-4" />
            Explore MetaMask Card — spend crypto anywhere
          </a>
        </div>
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
          disabled={isProcessing || (!fundingStatus.isFunded && fundingStatus.checked)}
          className={`
            w-full rounded-lg px-6 py-3 text-sm font-medium transition
            ${
              isProcessing || (!fundingStatus.isFunded && fundingStatus.checked)
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
          ) : !fundingStatus.isFunded && fundingStatus.checked ? (
            <span className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Contract Drained
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              Claim {SGE_CONFIG.sgeReward.toLocaleString()} SGE for{" "}
              {SGE_CONFIG.claimAmountHuman} {selectedToken}
            </span>
          )}
        </button>
      )}

      {/* Notices */}
      <div className="space-y-3 text-xs text-white/40 leading-relaxed pt-2 border-t border-white/[0.04]">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <span>
            SGE tokens represent participation in the SGE ecosystem and governance.
            They are <span className="text-white/60">not an investment product</span>{" "}
            and carry no guarantee of financial return.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <span>
            Each wallet may claim only once. The claim contract enforces this on-chain.
          </span>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
          <span>
            This transaction occurs on{" "}
            <span className="text-white/60">Ethereum Mainnet</span>. You need ETH for gas.
            Approval and claim are separate transactions.
          </span>
        </div>
      </div>
    </div>
  );
}
