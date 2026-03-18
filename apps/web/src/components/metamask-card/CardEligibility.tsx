"use client";

import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import type { CardEligibilityResult } from "@/lib/metamask/card";

interface Props {
  result: CardEligibilityResult | null;
}

export function CardEligibility({ result }: Props) {
  if (!result) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
          Card Readiness
        </h3>
        <div className="flex items-center gap-3 text-sm text-white/30">
          <HelpCircle className="w-4 h-4" />
          Connect your wallet to check MetaMask Card readiness.
        </div>
      </div>
    );
  }

  const checks = [
    {
      label: "MetaMask Wallet",
      ok: result.hasMetaMask,
      detail: result.hasMetaMask ? "Detected" : "Not detected",
    },
    {
      label: "Supported Network",
      ok: result.hasCompatibleNetwork,
      detail: result.hasCompatibleNetwork
        ? result.compatibleNetworks.join(", ")
        : "Not on a supported network",
    },
    {
      label: "Supported Token Balance",
      ok: result.hasCompatibleToken,
      detail: result.hasCompatibleToken
        ? result.compatibleTokens.join(", ")
        : "No supported token balance found",
    },
    {
      label: "Region Availability",
      ok: result.regionSupported,
      detail:
        result.regionSupported === null
          ? "Not checked"
          : result.regionSupported
          ? "Available"
          : "May not be available in your region",
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          Card Readiness
        </h3>
        {result.isEligible && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="w-3 h-3" /> Ready
          </span>
        )}
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-3">
            {check.ok === true ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : check.ok === false ? (
              <XCircle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-white/20 shrink-0" />
            )}
            <div>
              <div className="text-sm text-white/70">{check.label}</div>
              <div className="text-xs text-white/30">{check.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {result.suggestions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">
          {result.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-white/40">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
