"use client";

import { Coins, CheckCircle2 } from "lucide-react";
import { SUPPORTED_TOKENS } from "@/lib/metamask/card";

export function CardTokenSupport() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Supported Tokens
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="pb-2 text-xs text-white/30 font-medium">Token</th>
              <th className="pb-2 text-xs text-white/30 font-medium">Networks</th>
              <th className="pb-2 text-xs text-white/30 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {SUPPORTED_TOKENS.map((token) => (
              <tr key={token.symbol} className="border-b border-white/[0.04]">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-white/30" />
                    <div>
                      <span className="text-white/70 font-medium">{token.symbol}</span>
                      <span className="text-white/30 text-xs ml-2">{token.name}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    {token.networks.map((n) => (
                      <span
                        key={n}
                        className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="flex items-center justify-end gap-1 text-xs text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {token.status === "supported" ? "Supported" : "Limited"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
