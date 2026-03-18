"use client";

import { Coins } from "lucide-react";
import { SGE_CONFIG, type SGETokenSymbol } from "@/lib/config/sge";

interface Props {
  selected: SGETokenSymbol;
  onChange: (token: SGETokenSymbol) => void;
  disabled?: boolean;
}

export function StablecoinSelector({ selected, onChange, disabled }: Props) {
  const tokens = Object.entries(SGE_CONFIG.tokens) as [SGETokenSymbol, (typeof SGE_CONFIG.tokens)[SGETokenSymbol]][];

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-white/30 mb-3">
        Select Payment Token
      </label>
      <div className="grid grid-cols-2 gap-3">
        {tokens.map(([symbol, cfg]) => (
          <button
            key={symbol}
            disabled={disabled}
            onClick={() => onChange(symbol)}
            className={`
              flex items-center gap-3 rounded-lg border p-4 transition
              ${selected === symbol
                ? "border-emerald-500/40 bg-emerald-500/10 text-white"
                : "border-white/[0.06] bg-white/[0.01] text-white/50 hover:border-white/10 hover:text-white/70"
              }
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            `}
          >
            <Coins className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium text-sm">{symbol}</div>
              <div className="text-xs text-white/30">{cfg.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
