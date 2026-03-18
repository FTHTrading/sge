"use client";

import {
  CreditCard,
  Globe,
  Coins as CoinsIcon,
  Network,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  METAMASK_CARD_URLS,
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  SUPPORTED_REGIONS,
  CARD_PERKS,
} from "@/lib/metamask/card";

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; cls: string }> = {
  available: { icon: CheckCircle2, cls: "text-emerald-400" },
  waitlist: { icon: Clock, cls: "text-amber-400" },
  unavailable: { icon: XCircle, cls: "text-red-400/50" },
};

export default function AdminMetaMaskCardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">MetaMask Card Configuration</h1>
        <p className="text-sm text-white/40 mt-1">
          Reference data for the MetaMask Card readiness and routing module.
          This system does <strong className="text-white/60">not</strong> issue or manage cards.
        </p>
      </div>

      {/* Boundary Notice */}
      <div className="rounded-xl border border-[#f6851b]/30 bg-[#f6851b]/5 px-6 py-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#f6851b] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-[#f6851b]/80">
          <strong className="text-[#f6851b]">Integration Boundary:</strong> Our system provides a{" "}
          <em>readiness and routing layer</em> only. We detect MetaMask wallet, check supported
          networks/tokens, evaluate region availability, and deep-link users to official MetaMask
          Card resources. Card issuance, KYC, funding, and spending are managed entirely by
          Consensys / MetaMask.
        </div>
      </div>

      {/* Official URLs */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <ExternalLink className="w-5 h-5 text-[#f6851b]" />
          <h2 className="text-sm font-semibold text-white">Official MetaMask Card URLs</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(METAMASK_CARD_URLS).map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition group"
              >
                <span className="capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-[#f6851b] transition" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Networks */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <Network className="w-5 h-5 text-[#f6851b]" />
          <h2 className="text-sm font-semibold text-white">Supported Networks</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3">
            {SUPPORTED_NETWORKS.map((net) => (
              <div
                key={net.name}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-white">{net.name}</div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {net.chainId ? `Chain ID: ${net.chainId}` : "Non-EVM"}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-white/20">
                  {net.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Tokens */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <CoinsIcon className="w-5 h-5 text-[#f6851b]" />
          <h2 className="text-sm font-semibold text-white">Supported Tokens</h2>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-white/30 uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left py-2 px-3">Symbol</th>
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Networks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {SUPPORTED_TOKENS.map((token) => (
                <tr key={token.symbol} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-3 font-bold text-white">{token.symbol}</td>
                  <td className="py-3 px-3 text-white/50">{token.name}</td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {token.networks.map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Region Availability */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <Globe className="w-5 h-5 text-[#f6851b]" />
          <h2 className="text-sm font-semibold text-white">Region Availability</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {SUPPORTED_REGIONS.map((region) => {
              const status = STATUS_ICON[region.status] ?? STATUS_ICON.unavailable!;
              const Icon = status.icon;
              return (
                <div
                  key={region.region}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{region.region}</span>
                    <Icon className={`w-4 h-4 ${status.cls}`} />
                  </div>
                  <div className="text-xs text-white/30 capitalize">{region.status}</div>
                  {region.tiers.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {region.tiers.map((tier) => (
                        <span
                          key={tier}
                          className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40 capitalize"
                        >
                          {tier}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <CreditCard className="w-5 h-5 text-[#f6851b]" />
          <h2 className="text-sm font-semibold text-white">Card Perks</h2>
        </div>
        <div className="p-6 space-y-3">
          {CARD_PERKS.map((perk) => (
            <div key={perk.title} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm text-white/80 font-medium">{perk.title}</div>
                <div className="text-xs text-white/30">{perk.description}</div>
                {perk.partner && (
                  <span className="inline-flex items-center mt-1 rounded-full bg-[#f6851b]/10 border border-[#f6851b]/20 px-2 py-0.5 text-[10px] text-[#f6851b]/80">
                    Partner: {perk.partner}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] px-6 py-4">
        <p className="text-xs text-white/20 leading-relaxed">
          MetaMask Card is a product of Consensys. All card-related features, including issuance,
          KYC, funding, and spending, are managed by MetaMask / Consensys. This admin panel is a
          reference view of the configuration used by the SGE readiness and routing module. It does
          not provide control over MetaMask Card operations.
        </p>
      </div>
    </div>
  );
}
