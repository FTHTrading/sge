"use client";

import {
  Database,
  Shield,
  Coins,
  Copy,
  Terminal,
  CheckCircle2,
  ExternalLink,
  AlertTriangle,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
} from "lucide-react";
import { useState, useCallback } from "react";

/* ══════════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════════ */

const FUNDING_FLOW = [
  "1. Funder wallet holds SGE tokens",
  "2. Approve: funder approves target (Distributor or Vault) for spending",
  "   → For legacy SGE: zero-first approval pattern (set to 0, then set to amount)",
  "3a. Fund Distributor: call distributor.fundInventory(amount)",
  "3b. Fund Vault: call vault.deposit(amount)",
  "4. Verify: check inventoryBalance() or vault.balance()",
] as const;

const VAULT_OPERATIONS = [
  { op: "deposit(amount)", role: "Any (token holder)", desc: "Deposit SGE tokens into the vault. Requires prior approval." },
  { op: "balance()", role: "Public (view)", desc: "Returns the current SGE balance held by the vault." },
  { op: "release(to, amount)", role: "DISTRIBUTOR_ROLE", desc: "Release SGE to a target address. Only authorized distributors." },
  { op: "pause()", role: "ADMIN_ROLE", desc: "Freeze all vault operations." },
  { op: "unpause()", role: "ADMIN_ROLE", desc: "Resume vault operations." },
  { op: "setDistributor(addr, bool)", role: "ADMIN_ROLE", desc: "Authorize/revoke a distributor address." },
  { op: "emergencyWithdraw(to)", role: "ADMIN_ROLE", desc: "Move ALL SGE to a target address. Emergency only." },
  { op: "rescueToken(token, to, amount)", role: "ADMIN_ROLE", desc: "Rescue accidentally sent non-SGE tokens." },
] as const;

const DISTRIBUTOR_INVENTORY_OPS = [
  { op: "fundInventory(amount)", role: "Any (token holder)", desc: "Top up the distributor's claim inventory. Requires prior approval." },
  { op: "inventoryBalance()", role: "Public (view)", desc: "Returns the SGE available for distribution." },
  { op: "drainToTreasury()", role: "ADMIN_ROLE", desc: "Move all inventory SGE back to the treasury vault." },
] as const;

const READINESS_CHECKS = [
  { check: "SGE token reachable", desc: "Can read symbol() and decimals() from the legacy token contract." },
  { check: "Distributor deployed", desc: "Contract code exists at SGE_DISTRIBUTOR_ADDRESS." },
  { check: "Treasury Vault deployed", desc: "Contract code exists at SGE_TREASURY_ADDRESS." },
  { check: "Distributor linked to correct token", desc: "distributor.sgeToken() == SGE_TOKEN_ADDRESS." },
  { check: "Vault linked to correct token", desc: "vault.sgeToken() == SGE_TOKEN_ADDRESS." },
  { check: "Distributor not paused", desc: "distributor.paused() == false." },
  { check: "Vault not paused", desc: "vault.paused() == false." },
  { check: "Inventory has SGE", desc: "distributor.inventoryBalance() > 0." },
  { check: "Vault has SGE", desc: "vault.balance() > 0." },
  { check: "Distributor authorized by Vault", desc: "vault.hasRole(DISTRIBUTOR_ROLE, distributor)." },
  { check: "Admin has ADMIN_ROLE on Distributor", desc: "distributor.hasRole(ADMIN_ROLE, admin)." },
  { check: "Admin has ADMIN_ROLE on Vault", desc: "vault.hasRole(ADMIN_ROLE, admin)." },
] as const;

/* ══════════════════════════════════════════════════
   Components
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

function CommandBlock({ command, description }: { command: string; description?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="space-y-1">
      {description && <p className="text-xs text-white/40">{description}</p>}
      <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-white/[0.06] px-4 py-3 font-mono text-sm text-emerald-300">
        <Terminal className="w-4 h-4 text-white/30 shrink-0" />
        <code className="flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
        <button onClick={copy} className="text-white/30 hover:text-white transition shrink-0" title="Copy">
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════ */

export default function AdminSgeTreasuryPage() {
  return (
    <div className="min-h-screen bg-[hsl(220,16%,4%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Treasury & Inventory</h1>
          </div>
          <p className="text-white/50 text-sm">
            Manage SGE token inventory across the Distributor and Treasury Vault contracts.
          </p>
        </div>

        {/* Funding Flow */}
        <SectionCard title="Funding Flow" icon={ArrowDownLeft}>
          <div className="space-y-1">
            {FUNDING_FLOW.map((step, i) => (
              <div key={i} className="rounded-lg bg-black/20 border border-white/[0.04] px-4 py-2.5">
                <p className="text-sm text-white/60 font-mono">{step}</p>
              </div>
            ))}
          </div>
          <div className="pt-2 space-y-3">
            <CommandBlock
              command="SGE_FUND_AMOUNT=50000 npx ts-node apps/web/scripts/fund-sge-inventory.ts"
              description="Fund the Distributor with 50,000 SGE (default target)"
            />
            <CommandBlock
              command="SGE_FUND_TARGET=vault SGE_FUND_AMOUNT=100000 npx ts-node apps/web/scripts/fund-sge-inventory.ts"
              description="Fund the Treasury Vault directly"
            />
          </div>
        </SectionCard>

        {/* Treasury Vault Operations */}
        <SectionCard title="Treasury Vault Operations" icon={Lock}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Function</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Access</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {VAULT_OPERATIONS.map((op) => (
                  <tr key={op.op} className="border-b border-white/[0.03]">
                    <td className="py-2 px-3 font-mono text-xs text-emerald-400">{op.op}</td>
                    <td className="py-2 px-3">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs text-white/60">{op.role}</span>
                    </td>
                    <td className="py-2 px-3 text-xs text-white/50">{op.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Distributor Inventory */}
        <SectionCard title="Distributor Inventory" icon={Coins}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Function</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Access</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {DISTRIBUTOR_INVENTORY_OPS.map((op) => (
                  <tr key={op.op} className="border-b border-white/[0.03]">
                    <td className="py-2 px-3 font-mono text-xs text-emerald-400">{op.op}</td>
                    <td className="py-2 px-3">
                      <span className="rounded bg-white/[0.06] px-2 py-0.5 text-xs text-white/60">{op.role}</span>
                    </td>
                    <td className="py-2 px-3 text-xs text-white/50">{op.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Readiness Checklist */}
        <SectionCard title="Readiness Checklist" icon={Activity}>
          <p className="text-sm text-white/50">
            All checks performed by <code className="text-emerald-400/80">preflight-sge-legacy.ts</code>.
          </p>
          <div className="space-y-2">
            {READINESS_CHECKS.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <span className="text-xs text-white/30 font-mono min-w-[20px]">{i + 1}.</span>
                <div>
                  <p className="text-sm text-white/70 font-medium">{r.check}</p>
                  <p className="text-xs text-white/40 mt-0.5">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <CommandBlock
            command="npx ts-node apps/web/scripts/preflight-sge-legacy.ts"
            description="Run all readiness checks"
          />
        </SectionCard>

        {/* Emergency Procedures */}
        <SectionCard title="Emergency Procedures" icon={AlertTriangle}>
          <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 space-y-3">
            <p className="text-sm text-red-400 font-medium">These operations should only be used in emergencies.</p>
            <div className="space-y-2">
              <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <code className="text-xs text-red-400 font-mono">distributor.drainToTreasury()</code>
                <p className="text-xs text-white/40 mt-1">Move all Distributor inventory back to the Vault. Requires ADMIN_ROLE.</p>
              </div>
              <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <code className="text-xs text-red-400 font-mono">vault.emergencyWithdraw(safeAddress)</code>
                <p className="text-xs text-white/40 mt-1">Move ALL Vault SGE to a safe address. Requires ADMIN_ROLE. Use as last resort.</p>
              </div>
              <div className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <code className="text-xs text-red-400 font-mono">distributor.pause() / vault.pause()</code>
                <p className="text-xs text-white/40 mt-1">Freeze all operations. Requires ADMIN_ROLE. Can be reversed with unpause().</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
