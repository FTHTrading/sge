"use client";

import { ClaimCard } from "@/components/claim/ClaimCard";

export default function ClaimSGEPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Claim SGE Tokens</h1>
        <p className="text-sm text-white/40 mt-1">
          Participate in the SGE ecosystem — claim your allocation using USDC or USDT on Ethereum Mainnet.
        </p>
      </div>
      <ClaimCard />
    </div>
  );
}
