"use client";

import { Globe, CheckCircle2, Clock, XCircle } from "lucide-react";
import { SUPPORTED_REGIONS } from "@/lib/metamask/card";

export function CardActivationGuide() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
        Availability by Region
      </h3>
      <div className="space-y-3">
        {SUPPORTED_REGIONS.map((region) => (
          <div
            key={region.region}
            className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3"
          >
            <Globe className="w-4 h-4 text-white/30 shrink-0" />
            <div className="flex-1">
              <div className="text-sm text-white/70">{region.region}</div>
              {region.notes && (
                <div className="text-xs text-white/30 mt-0.5">{region.notes}</div>
              )}
              {region.tiers.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {region.tiers.map((tier) => (
                    <span
                      key={tier}
                      className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/40 capitalize"
                    >
                      {tier}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {region.status === "available" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : region.status === "waitlist" ? (
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-white/20 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Getting started steps */}
      <div className="mt-6 pt-4 border-t border-white/[0.04]">
        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
          Getting Started
        </h4>
        <ol className="space-y-2 text-xs text-white/40 list-decimal list-inside">
          <li>Install MetaMask browser extension or mobile app</li>
          <li>Open MetaMask Portfolio at portfolio.metamask.io</li>
          <li>Navigate to the Card section</li>
          <li>Complete identity verification if required</li>
          <li>Activate your virtual card or request a Metal card (US only)</li>
          <li>Add to Apple Pay or Google Pay for contactless use</li>
        </ol>
      </div>
    </div>
  );
}
