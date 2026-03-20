"use client";

import {
  Wallet,
  CheckCircle2,
  XCircle,
  Copy,
  Terminal,
  ExternalLink,
  Search,
  AlertTriangle,
  Clock,
  Users,
  Hash,
} from "lucide-react";
import { useState, useCallback } from "react";
import { explorerAddressUrl } from "@/lib/config/sge";

/* ══════════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════════ */

const CLAIM_STATES = [
  { state: "Unclaimed", desc: "Wallet has never called claimExact(). Eligible if not paused/denied.", color: "text-white/60" },
  { state: "Claimed", desc: "hasClaimed(wallet) == true. Wallet received its allocation. One-time only.", color: "text-emerald-400" },
  { state: "Denied", desc: "Access Manager denylist (off-chain enforcement by operator, or future on-chain integration).", color: "text-red-400" },
  { state: "Not Allowed", desc: "Allowlist enabled, address not included (off-chain enforcement by operator, or future on-chain integration).", color: "text-amber-400" },
  { state: "KYC Missing", desc: "KYC required but wallet not verified (off-chain enforcement by operator, or future on-chain integration).", color: "text-amber-400" },
] as const;

const DISTRIBUTOR_EVENTS = [
  { event: "Claimed(claimer, amount)", desc: "Emitted on successful claimExact(). Indexed by claimer address." },
  { event: "Distributed(operator, recipient, amount)", desc: "Emitted on operator distribute() call. Indexed by operator + recipient." },
  { event: "InventoryFunded(funder, amount, newBalance)", desc: "Emitted when inventory is topped up." },
  { event: "ClaimAmountUpdated(oldAmount, newAmount)", desc: "Emitted when admin changes the per-claim amount." },
] as const;

const ADMIN_OPERATIONS = [
  { op: "distribute(recipient, amount)", role: "OPERATOR_ROLE", desc: "Push SGE to a specific address (bypasses claimExact limits)." },
  { op: "setClaimAmount(newAmount)", role: "ADMIN_ROLE", desc: "Change the per-wallet claim amount." },
  { op: "pause()", role: "ADMIN_ROLE", desc: "Freeze all claims and distributions." },
  { op: "unpause()", role: "ADMIN_ROLE", desc: "Resume operations." },
  { op: "drainToTreasury()", role: "ADMIN_ROLE", desc: "Move all inventory back to the treasury vault." },
  { op: "rescueToken(token, to, amount)", role: "ADMIN_ROLE", desc: "Rescue accidentally sent tokens (not SGE)." },
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

function AddressLink({ address }: { address: string }) {
  return (
    <a
      href={explorerAddressUrl(address)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 hover:text-emerald-300 transition break-all"
    >
      {address}
      <ExternalLink className="w-3 h-3 shrink-0" />
    </a>
  );
}

/* ══════════════════════════════════════════════════
   Claim Lookup (Read-Only UI)
   ══════════════════════════════════════════════════ */

function ClaimLookup() {
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const lookup = useCallback(() => {
    if (!address || !address.startsWith("0x") || address.length !== 42) {
      setResult("Invalid address. Must be a 42-character hex address starting with 0x.");
      return;
    }
    // In production this would call the on-chain hasClaimed(address)
    // For now it provides the CLI command to check
    setResult(`To check on-chain, run:\nnpx ts-node scripts/inspect-sge-system.ts\n\nOr query hasClaimed("${address}") on the Distributor contract directly.`);
  }, [address]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-white/50">
        Look up whether a wallet has already claimed via the Distributor.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="flex-1 rounded-lg bg-black/40 border border-white/[0.08] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
        />
        <button
          onClick={lookup}
          className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/20 transition"
        >
          <Search className="w-4 h-4" />
          Lookup
        </button>
      </div>
      {result && (
        <pre className="rounded-lg bg-black/40 border border-white/[0.06] p-4 font-mono text-xs text-white/70 whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════ */

export default function AdminSgeClaimsPage() {
  return (
    <div className="min-h-screen bg-[hsl(220,16%,4%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Claims Management</h1>
          </div>
          <p className="text-white/50 text-sm">
            Manage SGE token claims through the SgeDistributor contract. View claim states, events, and admin operations.
          </p>
        </div>

        {/* Claim Lookup */}
        <SectionCard title="Claim Lookup" icon={Search}>
          <ClaimLookup />
        </SectionCard>

        {/* Claim States Reference */}
        <SectionCard title="Claim States" icon={Users}>
          <div className="space-y-2">
            {CLAIM_STATES.map((s) => (
              <div key={s.state} className="flex items-start gap-3 rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <span className={`text-sm font-medium min-w-[100px] ${s.color}`}>{s.state}</span>
                <span className="text-sm text-white/50">{s.desc}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* On-chain Events */}
        <SectionCard title="Distributor Events" icon={Hash}>
          <p className="text-sm text-white/50">
            These events are emitted by the SgeDistributor and can be queried via Etherscan or RPC.
          </p>
          <div className="space-y-2">
            {DISTRIBUTOR_EVENTS.map((e) => (
              <div key={e.event} className="rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <code className="text-xs text-emerald-400 font-mono">{e.event}</code>
                <p className="text-xs text-white/40 mt-1">{e.desc}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Admin Operations */}
        <SectionCard title="Admin Operations" icon={AlertTriangle}>
          <p className="text-sm text-white/50">
            These operations require the appropriate role on the SgeDistributor contract.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Function</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Required Role</th>
                  <th className="text-left py-2 px-3 text-white/40 font-normal">Description</th>
                </tr>
              </thead>
              <tbody>
                {ADMIN_OPERATIONS.map((op) => (
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

        {/* CLI Commands */}
        <SectionCard title="Related CLI Commands" icon={Terminal}>
          <div className="space-y-3">
            <CommandBlock command="npx ts-node apps/web/scripts/test-sge-claim.ts" />
            <p className="text-xs text-white/40">
              Set <code className="text-emerald-400/80">DRY_RUN=false</code> for live execution.
              Requires <code className="text-emerald-400/80">PRIVATE_KEY</code> and <code className="text-emerald-400/80">SGE_DISTRIBUTOR_ADDRESS</code>.
            </p>
            <CommandBlock command="npx ts-node apps/web/scripts/inspect-sge-system.ts" />
            <p className="text-xs text-white/40">
              Read-only snapshot of all contracts, balances, roles, and pause state.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
