"use client";

import { Gift, ExternalLink } from "lucide-react";
import { CARD_PERKS } from "@/lib/metamask/card";

export function CardBenefits() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Card Benefits & Perks
      </h3>
      <div className="space-y-4">
        {CARD_PERKS.filter((p) => p.active).map((perk) => (
          <div
            key={perk.title}
            className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-4"
          >
            <Gift className="w-4 h-4 text-[#f6851b] mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white/80">{perk.title}</div>
              <div className="text-xs text-white/40 mt-1">{perk.description}</div>
              {perk.partner && (
                <span className="inline-block mt-2 rounded-full bg-[#f6851b]/10 border border-[#f6851b]/20 px-2 py-0.5 text-[10px] font-medium text-[#f6851b]">
                  {perk.partner}
                </span>
              )}
            </div>
            {perk.url && (
              <a
                href={perk.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/20 hover:text-[#f6851b] transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
