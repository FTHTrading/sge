"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditCard, Wallet, RefreshCw } from "lucide-react";
import { isMetaMask, connectWallet, getChainId } from "@/lib/web3/sgeClaim";
import {
  checkCardEligibility,
  type CardEligibilityResult,
} from "@/lib/metamask/card";
import { CardEligibility } from "@/components/metamask-card/CardEligibility";
import { CardBenefits } from "@/components/metamask-card/CardBenefits";
import { CardNetworkSupport } from "@/components/metamask-card/CardNetworkSupport";
import { CardTokenSupport } from "@/components/metamask-card/CardTokenSupport";
import { CardActivationGuide } from "@/components/metamask-card/CardActivationGuide";
import { CardLaunchCTA } from "@/components/metamask-card/CardLaunchCTA";

export default function MetaMaskCardPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [eligibility, setEligibility] = useState<CardEligibilityResult | null>(null);
  const [loading, setLoading] = useState(false);

  const checkEligibility = useCallback(async () => {
    const metamask = isMetaMask();
    if (!metamask || !walletAddress) {
      setEligibility(
        checkCardEligibility({
          hasMetaMask: metamask,
          connectedChainId: null,
          tokenBalances: {},
        })
      );
      return;
    }

    setLoading(true);
    try {
      const cid = await getChainId();
      setChainId(cid);

      // Attempt to read balances on the connected chain
      // We check for well-known stablecoin balances if on a supported chain
      const tokenBalances: Record<string, bigint> = {};

      // For eligibility check, we just need to know if they have *some* balance
      // A full balance read would require chain-specific token addresses
      // For now, pass empty to trigger suggestion
      setEligibility(
        checkCardEligibility({
          hasMetaMask: true,
          connectedChainId: cid,
          tokenBalances,
        })
      );
    } catch {
      setEligibility(
        checkCardEligibility({
          hasMetaMask: true,
          connectedChainId: chainId,
          tokenBalances: {},
        })
      );
    } finally {
      setLoading(false);
    }
  }, [walletAddress, chainId]);

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
    } catch {
      // User rejected or no wallet
    }
  };

  // Re-check eligibility when wallet connects
  useEffect(() => {
    checkEligibility();
  }, [walletAddress, checkEligibility]);

  // Listen for chain changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    const handleChainChanged = () => {
      checkEligibility();
    };
    ethereum.on?.("chainChanged", handleChainChanged);
    return () => {
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [checkEligibility]);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6 text-[#f6851b]" />
          <h1 className="text-2xl font-bold text-white">MetaMask Card</h1>
        </div>
        <p className="text-sm text-white/40">
          Spend crypto anywhere Mastercard is accepted. Check your readiness and access the official MetaMask Card flow.
        </p>
      </div>

      {/* Connect / status bar */}
      <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
        {walletAddress ? (
          <>
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm text-white/60">
              Connected: <span className="text-white font-mono">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
            </span>
            <button
              onClick={checkEligibility}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </>
        ) : (
          <>
            <div className="h-2.5 w-2.5 rounded-full bg-white/20 animate-pulse" />
            <span className="text-sm text-white/40">Not connected</span>
            <button
              onClick={handleConnect}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-[#f6851b]/10 border border-[#f6851b]/20 px-4 py-2 text-xs font-medium text-[#f6851b] hover:bg-[#f6851b]/20 transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect MetaMask
            </button>
          </>
        )}
      </div>

      {/* Eligibility */}
      <CardEligibility result={eligibility} />

      {/* Official CTAs */}
      <CardLaunchCTA />

      {/* Support matrix */}
      <div className="grid gap-6 md:grid-cols-2">
        <CardNetworkSupport connectedChainId={chainId} />
        <CardTokenSupport />
      </div>

      {/* Benefits */}
      <CardBenefits />

      {/* Region guide */}
      <CardActivationGuide />

      {/* Bottom disclaimer */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4">
        <p className="text-[10px] text-white/20 leading-relaxed text-center">
          MetaMask Card is a product of MetaMask (Consensys) in partnership with Mastercard.
          SGE Foundation provides this information page as a convenience.
          We do not issue, manage, or service MetaMask Card.
          All card inquiries should be directed to MetaMask support.
        </p>
      </div>
    </div>
  );
}
