"use client";

import {
  Coins,
  ExternalLink,
  Shield,
  Wallet,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Terminal,
  ArrowRight,
  Database,
  Lock,
  Unlock,
  Settings,
} from "lucide-react";
import { useState, useCallback } from "react";
import { SGE_CONFIG, explorerAddressUrl } from "@/lib/config/sge";
import { SGE_LEGACY_TOKEN } from "@/lib/sge-legacy/config";
import Link from "next/link";

/* ══════════════════════════════════════════════════
   Data (from repo source of truth)
   ══════════════════════════════════════════════════ */

const CONTRACTS = [
  {
    name: "SGE Token (Legacy)",
    address: SGE_CONFIG.sgeToken,
    role: "The immutable ERC-20-like token on mainnet. Not fully compliant — no bool return, no Approval event, approve race.",
    status: "deployed" as const,
  },
  {
    name: "Claim Contract (Legacy)",
    address: SGE_CONFIG.claimContract,
    role: "Original claim contract. Accepts stablecoin, dispatches SGE. Currently DRAINED (0 SGE).",
    status: "deployed" as const,
  },
  {
    name: "SgeDistributor",
    address: process.env.NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS ?? null,
    role: "New controlled distribution contract. SafeERC20, RBAC, pausable, claim-once enforcement.",
    status: (process.env.NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS ? "deployed" : "not-deployed") as "deployed" | "not-deployed",
  },
  {
    name: "SgeTreasuryVault",
    address: process.env.NEXT_PUBLIC_SGE_TREASURY_ADDRESS ?? null,
    role: "Custody vault. Holds SGE reserves separately from distribution logic.",
    status: (process.env.NEXT_PUBLIC_SGE_TREASURY_ADDRESS ? "deployed" : "not-deployed") as "deployed" | "not-deployed",
  },
  {
    name: "SgeAccessManager",
    address: process.env.NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS ?? null,
    role: "Compliance gate. Allowlist, denylist, KYC, jurisdiction controls. No token custody.",
    status: (process.env.NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS ? "deployed" : "not-deployed") as "deployed" | "not-deployed",
  },
] as const;

const LEGACY_QUIRKS = [
  { label: "transfer() returns bool", value: SGE_LEGACY_TOKEN.legacy.transferReturnsBool ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.transferReturnsBool },
  { label: "Emits Approval event", value: SGE_LEGACY_TOKEN.legacy.emitsApprovalEvent ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.emitsApprovalEvent },
  { label: "Approve race condition", value: SGE_LEGACY_TOKEN.legacy.approveRaceCondition ? "Vulnerable" : "Safe", ok: !SGE_LEGACY_TOKEN.legacy.approveRaceCondition },
  { label: "Has admin/owner", value: SGE_LEGACY_TOKEN.legacy.hasAdmin ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.hasAdmin },
  { label: "Pausable", value: SGE_LEGACY_TOKEN.legacy.hasPause ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.hasPause },
  { label: "Has rescue function", value: SGE_LEGACY_TOKEN.legacy.hasRescue ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.hasRescue },
  { label: "Modern Solidity (0.8+)", value: SGE_LEGACY_TOKEN.legacy.modernSolidity ? "Yes" : "No", ok: SGE_LEGACY_TOKEN.legacy.modernSolidity },
  { label: "Upgradeable", value: SGE_LEGACY_TOKEN.legacy.isUpgradeable ? "Yes" : "No", ok: false },
] as const;

const QUICK_LINKS = [
  { label: "Claims Management", href: "/admin/sge/claims", icon: Wallet },
  { label: "Treasury & Inventory", href: "/admin/sge/treasury", icon: Database },
  { label: "Operator Testing", href: "/admin/sge/testing", icon: Terminal },
  { label: "Legacy Operator Testing", href: "/operator-testing", icon: Shield },
] as const;

const CLI_SCRIPTS = [
  { name: "preflight-sge-legacy.ts", desc: "Read-only system check — verifies RPC, token, contracts, roles, inventory" },
  { name: "deploy-sge-distributor.ts", desc: "Deploy all 3 contracts + link them (mainnet, real ETH)" },
  { name: "fund-sge-inventory.ts", desc: "Move SGE into Distributor or Vault (zero-first approval)" },
  { name: "test-sge-claim.ts", desc: "Execute claimExact() via Distributor (dry-run or live)" },
  { name: "inspect-sge-system.ts", desc: "Print full system snapshot — addresses, balances, roles, pause state" },
] as const;

/* ══════════════════════════════════════════════════
   Reusable Components
   ══════════════════════════════════════════════════ */

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-emerald-400 shrink-0" />
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AddressLink({ address, label }: { address: string; label?: string }) {
  return (
    <a
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 hover:text-emerald-300 transition break-all"
    >
      {label ?? address}
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
}

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-white/[0.06] px-4 py-3 font-mono text-sm text-emerald-300">
      <Terminal className="w-4 h-4 text-white/30 shrink-0" />
      <code className="flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <button onClick={copy} className="text-white/30 hover:text-white transition shrink-0" title="Copy">
        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════ */

export default function AdminSgePage() {
  return (
    <div className="min-h-screen bg-[hsl(220,16%,4%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Coins className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">SGE Token Administration</h1>
          </div>
          <p className="text-white/50 text-sm">
            Overview of the SGE legacy token system — contracts, quirks, operator tools, and deployment state.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition group"
            >
              <link.icon className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-white/80 group-hover:text-white">{link.label}</span>
              <ArrowRight className="w-4 h-4 text-white/20 ml-auto group-hover:text-emerald-400 transition" />
            </Link>
          ))}
        </div>

        {/* Contract Registry */}
        <SectionCard title="Contract Registry" icon={Shield}>
          <div className="space-y-3">
            {CONTRACTS.map((c) => (
              <div
                key={c.name}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg bg-black/20 border border-white/[0.04] p-4"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    c.status === "deployed" ? "bg-emerald-400" : "bg-amber-400"
                  }`} />
                  <span className="text-sm font-medium text-white truncate">{c.name}</span>
                </div>
                <div className="flex-1 min-w-0">
                  {c.address ? (
                    <AddressLink address={c.address} />
                  ) : (
                    <span className="text-xs text-amber-400/70 font-mono">NOT DEPLOYED</span>
                  )}
                </div>
                <p className="text-xs text-white/40 sm:max-w-[40%]">{c.role}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Legacy Token Quirks */}
        <SectionCard title="Legacy Token Compatibility" icon={AlertTriangle}>
          <p className="text-sm text-white/50">
            The SGE token at <AddressLink address={SGE_CONFIG.sgeToken} /> is NOT fully ERC-20 compliant.
            All new contracts use OpenZeppelin SafeERC20 to handle these quirks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {LEGACY_QUIRKS.map((q) => (
              <div
                key={q.label}
                className={`flex items-center justify-between rounded-lg px-4 py-2.5 text-sm ${
                  q.ok ? "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400"
                       : "bg-red-500/5 border border-red-500/10 text-red-400"
                }`}
              >
                <span className="text-white/60">{q.label}</span>
                <span className="font-mono text-xs">{q.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* CLI Scripts */}
        <SectionCard title="Operator CLI Scripts" icon={Terminal}>
          <p className="text-sm text-white/50 mb-2">
            All scripts are in <code className="text-emerald-400/80">apps/web/scripts/</code> and require
            appropriate env vars (<code className="text-emerald-400/80">MAINNET_RPC_URL</code>, <code className="text-emerald-400/80">PRIVATE_KEY</code>).
          </p>
          <div className="space-y-3">
            {CLI_SCRIPTS.map((s) => (
              <div key={s.name} className="space-y-1">
                <p className="text-xs text-white/40">{s.desc}</p>
                <CommandBlock command={`npx ts-node apps/web/scripts/${s.name}`} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Token Metadata */}
        <SectionCard title="Token Metadata" icon={Coins}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Name", value: SGE_LEGACY_TOKEN.name },
              { label: "Symbol", value: SGE_LEGACY_TOKEN.symbol },
              { label: "Decimals", value: String(SGE_LEGACY_TOKEN.decimals) },
              { label: "Chain", value: `Ethereum (${SGE_LEGACY_TOKEN.chainId})` },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="text-sm font-mono text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Architecture Diagram */}
        <SectionCard title="System Architecture" icon={Activity}>
          <div className="rounded-lg bg-black/40 border border-white/[0.06] p-6 font-mono text-xs text-white/70 leading-relaxed whitespace-pre overflow-x-auto">
{`┌─────────────────────────────────┐
│        SGE Token (Legacy)       │  Immutable ERC-20-like
│  0x4048...221a                  │  No admin, no pause, no rescue
└────────────┬────────────────────┘
             │ SafeERC20
     ┌───────┴───────┐
     │               │
┌────▼────┐    ┌─────▼─────┐
│ Distri- │    │ Treasury  │
│  butor  │◄──►│   Vault   │
│ (RBAC)  │    │  (RBAC)   │
└────┬────┘    └───────────┘
     │
┌────▼────────────────┐
│   Access Manager    │  Allowlist / Denylist
│   (Compliance)      │  KYC / Jurisdiction
└─────────────────────┘
`}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
