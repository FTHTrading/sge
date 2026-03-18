"use client";

import { ExternalLink, CreditCard, Rocket, BookOpen, Utensils } from "lucide-react";
import { METAMASK_CARD_URLS } from "@/lib/metamask/card";

export function CardLaunchCTA() {
  const links = [
    {
      label: "MetaMask Card Information",
      description: "Learn about the official MetaMask Card product",
      url: METAMASK_CARD_URLS.info,
      icon: CreditCard,
      primary: true,
    },
    {
      label: "Open MetaMask Portfolio",
      description: "Access or activate your card through MetaMask Portfolio",
      url: METAMASK_CARD_URLS.portfolio,
      icon: Rocket,
      primary: true,
    },
    {
      label: "Getting Started Guide",
      description: "Official step-by-step guide for setting up MetaMask Card",
      url: METAMASK_CARD_URLS.gettingStarted,
      icon: BookOpen,
      primary: false,
    },
    {
      label: "Blackbird Dining Benefits",
      description: "Exclusive dining perks for MetaMask Card holders",
      url: METAMASK_CARD_URLS.blackbird,
      icon: Utensils,
      primary: false,
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
        Official MetaMask Card Links
      </h3>
      <p className="text-xs text-white/30 mb-4">
        These link to official MetaMask pages. Card issuance and activation are handled directly by MetaMask.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group flex items-start gap-3 rounded-lg border p-4 transition
                ${link.primary
                  ? "border-[#f6851b]/20 bg-[#f6851b]/5 hover:bg-[#f6851b]/10 hover:border-[#f6851b]/30"
                  : "border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  link.primary ? "text-[#f6851b]" : "text-white/30 group-hover:text-white/50"
                }`}
              />
              <div className="flex-1">
                <div className={`text-sm font-medium ${link.primary ? "text-[#f6851b]" : "text-white/70"}`}>
                  {link.label}
                </div>
                <div className="text-xs text-white/30 mt-0.5">{link.description}</div>
              </div>
              <ExternalLink
                className={`w-3.5 h-3.5 mt-1 shrink-0 ${
                  link.primary ? "text-[#f6851b]/40" : "text-white/10"
                } group-hover:text-white/30 transition`}
              />
            </a>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.01] p-3">
        <p className="text-[10px] text-white/25 leading-relaxed">
          MetaMask Card is an official product of MetaMask (Consensys). SGE Foundation does not issue, manage,
          or control the MetaMask Card. All card features, availability, and terms are determined by MetaMask.
          Links above direct to official MetaMask properties.
        </p>
      </div>
    </div>
  );
}
