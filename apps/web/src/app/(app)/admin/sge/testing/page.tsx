"use client";

import {
  Terminal,
  Shield,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  AlertTriangle,
  AlertOctagon,
  Zap,
  ClipboardCheck,
  ChevronRight,
  FileText,
} from "lucide-react";
import { useState, useCallback } from "react";

/* ══════════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════════ */

const ENV_VARS_REQUIRED = [
  { name: "MAINNET_RPC_URL", desc: "Ethereum mainnet RPC endpoint", scope: "All scripts" },
  { name: "PRIVATE_KEY", desc: "Operator wallet private key (never exposed to browser)", scope: "Write scripts" },
  { name: "SGE_DISTRIBUTOR_ADDRESS", desc: "Deployed SgeDistributor contract", scope: "All legacy scripts" },
  { name: "SGE_TREASURY_ADDRESS", desc: "Deployed SgeTreasuryVault contract", scope: "All legacy scripts" },
  { name: "SGE_ACCESS_MANAGER_ADDRESS", desc: "Deployed SgeAccessManager contract", scope: "All legacy scripts" },
] as const;

const TEST_SEQUENCE = [
  { step: "1", action: "Run preflight", cmd: "npx ts-node apps/web/scripts/preflight-sge-legacy.ts", notes: "All items should be PASS or WARN (not FAIL)" },
  { step: "2", action: "Run inspect", cmd: "npx ts-node apps/web/scripts/inspect-sge-system.ts", notes: "Verify addresses, balances, roles" },
  { step: "3", action: "Fund inventory", cmd: "SGE_FUND_AMOUNT=1000 npx ts-node apps/web/scripts/fund-sge-inventory.ts", notes: "Must have SGE in funder wallet" },
  { step: "4", action: "Dry-run claim", cmd: "DRY_RUN=true npx ts-node apps/web/scripts/test-sge-claim.ts", notes: "Verify eligibility without sending tx" },
  { step: "5", action: "Live claim", cmd: "DRY_RUN=false npx ts-node apps/web/scripts/test-sge-claim.ts", notes: "REAL TX — spends gas, moves tokens" },
  { step: "6", action: "Post-claim verify", cmd: "npx ts-node apps/web/scripts/inspect-sge-system.ts", notes: "Confirm balances changed correctly" },
] as const;

const FAILURE_MODES = [
  { blocker: "Distributor not deployed", fix: "Run deploy-sge-distributor.ts first" },
  { blocker: "Distributor paused", fix: "Admin must call unpause()" },
  { blocker: "No inventory in distributor", fix: "Run fund-sge-inventory.ts" },
  { blocker: "Wallet already claimed", fix: "Use a different wallet — claims are one-time" },
  { blocker: "Insufficient ETH for gas", fix: "Fund operator wallet with ≥ 0.01 ETH" },
  { blocker: "Access denied by AccessManager", fix: "Check allowlist/denylist/KYC settings" },
  { blocker: "Wrong RPC / chain", fix: "Ensure MAINNET_RPC_URL connects to chain ID 1" },
  { blocker: "Missing env vars", fix: "Set all required env vars in .env.local" },
] as const;

const PASS_CRITERIA = [
  "Claim TX confirmed on-chain (not reverted)",
  "Claimer SGE balance increased by claimAmount",
  "Distributor inventoryBalance decreased by claimAmount",
  "hasClaimed(wallet) returns true",
  "No blocked/paused state encountered",
] as const;

const PROOF_FIELDS = [
  { key: "preflight_result", label: "Preflight Result", placeholder: "PASS / PASS_WITH_WARNINGS / FAIL" },
  { key: "wallet_address", label: "Wallet Address", placeholder: "0x..." },
  { key: "tx_hash", label: "Claim TX Hash", placeholder: "0x..." },
  { key: "sge_before", label: "SGE Before Claim", placeholder: "0.0" },
  { key: "sge_after", label: "SGE After Claim", placeholder: "1000.0" },
  { key: "inventory_before", label: "Inventory Before", placeholder: "50000.0" },
  { key: "inventory_after", label: "Inventory After", placeholder: "49000.0" },
  { key: "gas_used", label: "Gas Used", placeholder: "85000" },
  { key: "verdict", label: "Verdict", placeholder: "PASS / FAIL" },
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

function ChecklistItem({ label, index }: { label: string; index: number }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        className="mt-1 accent-emerald-500"
      />
      <span className={`text-sm transition ${checked ? "text-emerald-400 line-through" : "text-white/60 group-hover:text-white/80"}`}>
        {label}
      </span>
    </label>
  );
}

/* ══════════════════════════════════════════════════
   Live Proof Capture
   ══════════════════════════════════════════════════ */

function LiveProofCapture() {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const updateField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const verdictColor = fields.verdict?.toUpperCase() === "PASS"
    ? "text-emerald-400"
    : fields.verdict?.toUpperCase() === "FAIL"
      ? "text-red-400"
      : "text-white/50";

  const copyAll = useCallback(() => {
    const lines = PROOF_FIELDS.map((f) => `${f.label}: ${fields[f.key] ?? "(empty)"}`).join("\n");
    const block = `SGE Legacy Claim — Live Proof\n${"=".repeat(40)}\nTimestamp: ${new Date().toISOString()}\n\n${lines}`;
    navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fields]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50">
        Record results from each step of the live claim test. Fill in as you go, then copy the full proof block.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PROOF_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="text-xs text-white/40">{f.label}</label>
            <input
              type="text"
              value={fields[f.key] ?? ""}
              onChange={(e) => updateField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full rounded-lg bg-black/40 border border-white/[0.08] px-3 py-2 font-mono text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
        ))}
      </div>
      {fields.verdict && (
        <div className={`text-center text-lg font-bold ${verdictColor}`}>
          VERDICT: {fields.verdict?.toUpperCase()}
        </div>
      )}
      <button
        onClick={copyAll}
        className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/20 transition"
      >
        {copied ? <CheckCircle2 className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
        {copied ? "Copied!" : "Copy Full Proof Block"}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════ */

export default function AdminSgeTestingPage() {
  return (
    <div className="min-h-screen bg-[hsl(220,16%,4%)] p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Mainnet Warning */}
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertOctagon className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">Live testing moves real funds on mainnet.</p>
            <p className="text-xs text-red-400/60 mt-1">
              All write operations (fund, claim) are irreversible on Ethereum Mainnet.
              Double-check env vars and run preflight before any live test.
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Terminal className="w-7 h-7 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Legacy System — Operator Testing</h1>
          </div>
          <p className="text-white/50 text-sm">
            End-to-end testing workflow for the SGE legacy infra: Distributor, Vault, and AccessManager.
          </p>
        </div>

        {/* Required Env Vars */}
        <SectionCard title="Required Environment Variables" icon={Shield}>
          <div className="space-y-2">
            {ENV_VARS_REQUIRED.map((v) => (
              <div key={v.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <code className="text-xs text-emerald-400 font-mono min-w-[260px]">{v.name}</code>
                <span className="text-xs text-white/50 flex-1">{v.desc}</span>
                <span className="text-xs text-white/30">{v.scope}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Test Sequence */}
        <SectionCard title="Test Sequence" icon={Zap}>
          <div className="space-y-4">
            {TEST_SEQUENCE.map((s) => (
              <div key={s.step} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-xs text-emerald-400 font-bold">
                    {s.step}
                  </span>
                  <span className="text-sm text-white/80 font-medium">{s.action}</span>
                </div>
                <CommandBlock command={s.cmd} />
                <p className="text-xs text-white/40 pl-8">{s.notes}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Pass Criteria */}
        <SectionCard title="Pass Criteria" icon={CheckCircle2}>
          <div className="space-y-2">
            {PASS_CRITERIA.map((c, i) => (
              <ChecklistItem key={i} label={c} index={i} />
            ))}
          </div>
        </SectionCard>

        {/* Failure Modes */}
        <SectionCard title="Failure Modes & Fixes" icon={AlertTriangle}>
          <div className="space-y-2">
            {FAILURE_MODES.map((f) => (
              <div key={f.blocker} className="flex flex-col sm:flex-row gap-2 sm:gap-4 rounded-lg bg-black/20 border border-white/[0.04] p-3">
                <span className="text-sm text-red-400 font-medium min-w-[200px]">{f.blocker}</span>
                <span className="text-sm text-white/50">{f.fix}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Live Proof Capture */}
        <SectionCard title="Live Proof Capture" icon={FileText}>
          <LiveProofCapture />
        </SectionCard>
      </div>
    </div>
  );
}
