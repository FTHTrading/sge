"use client";

import { Network, CheckCircle2, Clock } from "lucide-react";
import { SUPPORTED_NETWORKS } from "@/lib/metamask/card";

interface Props {
  connectedChainId: number | null;
}

export function CardNetworkSupport({ connectedChainId }: Props) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Supported Networks
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {SUPPORTED_NETWORKS.map((network) => {
          const isConnected = network.chainId !== null && network.chainId === connectedChainId;
          return (
            <div
              key={network.name}
              className={`
                flex items-center gap-3 rounded-lg border p-3 transition
                ${isConnected
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-white/[0.06] bg-white/[0.01]"
                }
              `}
            >
              <Network className={`w-4 h-4 ${isConnected ? "text-emerald-400" : "text-white/30"}`} />
              <div>
                <div className="text-sm text-white/70">{network.name}</div>
                <div className="text-[10px] text-white/30">
                  {network.isEVM && network.chainId ? `Chain ${network.chainId}` : network.isEVM ? "EVM" : "Non-EVM"}
                </div>
              </div>
              {network.status === "supported" ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-white/20 ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
