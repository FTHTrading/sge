"use client";

import {
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Terminal,
  Wallet,
  Coins,
  CircleDot,
  Ban,
  ClipboardCheck,
  Zap,
  ChevronRight,
  ArrowRight,
  FileText,
  AlertOctagon,
} from "lucide-react";
import { useState, useCallback } from "react";
import { SGE_CONFIG, explorerAddressUrl } from "@/lib/config/sge";
import { DEMO_MODE } from "@/lib/config/demo";

/* ══════════════════════════════════════════════════
   Discovered Values — read from repo source of truth
   ══════════════════════════════════════════════════ */

const ENV_VARS = {
  MAINNET_RPC_URL: { default: "https://eth.llamarpc.com", required: true, scope: "CLI + live reads" },
  PRIVATE_KEY: { default: null, required: true, scope: "CLI scripts only — never exposed to browser" },
  CLAIM_CONTRACT_ADDRESS: { default: SGE_CONFIG.claimContract, required: false, scope: "Hardcoded fallback" },
  SGE_TOKEN_ADDRESS: { default: SGE_CONFIG.sgeToken, required: false, scope: "Hardcoded fallback" },
  USDC_TOKEN_ADDRESS: { default: SGE_CONFIG.tokens.USDC.address, required: false, scope: "Hardcoded fallback" },
  USDT_TOKEN_ADDRESS: { default: SGE_CONFIG.tokens.USDT.address, required: false, scope: "Hardcoded fallback" },
  NEXT_PUBLIC_DEMO_MODE: { default: "true", required: true, scope: "Must be 'false' for live testing" },
  NEXTAUTH_SECRET: { default: null, required: false, scope: "Auth only — not needed for claim test" },
  NEXTAUTH_URL: { default: "http://localhost:3000", required: false, scope: "Auth only" },
} as const;

const WALLETS = [
  {
    role: "Owner Wallet",
    address: SGE_CONFIG.contractOwner,
    purpose: "Funds SGE into claim contract via fundSGE() or direct transfer",
    needs: ["Enough SGE to load contract (≥ 1,000)", "ETH for gas"],
  },
  {
    role: "Claim Contract",
    address: SGE_CONFIG.claimContract,
    purpose: "Holds SGE inventory for payouts — users send stablecoin, receive SGE",
    needs: ["≥ 1,000 SGE loaded before live test", "Funded by owner wallet"],
  },
  {
    role: "Operator Test Wallet",
    address: null,
    purpose: "The wallet controlled by PRIVATE_KEY — signs approval + claim transactions",
    needs: ["100+ USDC or 100+ USDT", "≥ 0.02 ETH for gas", "Correct network (Mainnet)", "Private key set in .env.local"],
  },
  {
    role: "Recipient Wallet (Optional)",
    address: null,
    purpose: "Only needed if flow sends payout to a wallet different from the payer. Current contract sends SGE to msg.sender (same wallet).",
    needs: ["Not required for current contract"],
  },
] as const;

const REQUIRED_BALANCES = [
  { entity: "Claim Contract", asset: "SGE", minimum: "1,000", recommended: "2,000", note: "Loaded via owner" },
  { entity: "Operator Wallet", asset: "USDC or USDT", minimum: "100", recommended: "110", note: "At least one" },
  { entity: "Operator Wallet", asset: "ETH", minimum: "0.02", recommended: "0.05", note: "Gas for approve + claim" },
] as const;

const FAILURE_MODES = [
  { blocker: "Contract drained", cause: "0 SGE in contract", fix: "Owner must call fundSGE() or transfer SGE" },
  { blocker: "Insufficient ETH", cause: "< 0.02 ETH in wallet", fix: "Fund wallet with ETH" },
  { blocker: "Insufficient USDC/USDT", cause: "< 100 USDC and < 100 USDT", fix: "Fund wallet with stablecoin" },
  { blocker: "Missing PRIVATE_KEY", cause: "Not set in .env.local", fix: "Add PRIVATE_KEY=0x..." },
  { blocker: "Demo mode enabled", cause: "NEXT_PUBLIC_DEMO_MODE=true", fix: "Set to false" },
  { blocker: "Wrong chain / RPC", cause: "Chain ID ≠ 1", fix: "Set MAINNET_RPC_URL to mainnet endpoint" },
  { blocker: "Token allowance failure", cause: "USDT non-zero allowance", fix: "Script handles zero-first pattern" },
  { blocker: "Contract revert", cause: "Various on-chain reasons", fix: "Check preflight output for details" },
  { blocker: "Already claimed", cause: "Wallet already claimed", fix: "Use a different wallet" },
  { blocker: "No wallet connected", cause: "Browser: MetaMask not connected", fix: "Connect wallet in browser" },
] as const;

const TX_FLOW_STEPS = [
  "Load env vars from .env.local",
  "Connect wallet via PRIVATE_KEY → derive address",
  "Read readiness: chain, balances, contract SGE, hasClaimed",
  "Abort if any critical check fails",
  "Record before-balances (ETH, stablecoin, SGE)",
  "Check ERC-20 allowance for selected token",
  "For USDT: if existing allowance > 0, reset to 0 first (zero-first pattern)",
  "Approve stablecoin spend (100e6) to claim contract",
  "Execute claimWithUSDC() or claimWithUSDT()",
  "Wait for transaction receipt",
  "Record after-balances and compute deltas",
  "Print PASS/FAIL verdict",
] as const;

const PASS_CRITERIA = [
  "Claim tx hash is present and confirmed on-chain",
  "Operator stablecoin balance reduced by ≥ 100",
  "Operator SGE balance increased by ≥ 1,000",
  "Contract SGE balance reduced by 1,000",
  "hasClaimed(wallet) returns true",
  "No blocked state or revert occurred",
] as const;

const OPERATOR_CHECKLIST = [
  "Set PRIVATE_KEY in apps/web/.env.local",
  "Set NEXT_PUBLIC_DEMO_MODE=false",
  "Fund claim contract with ≥ 1,000 SGE",
  "Fund operator wallet with ≥ 0.02 ETH",
  "Fund operator wallet with ≥ 100 USDC or USDT",
  "Run preflight: npx tsx apps/web/scripts/preflight-claim.ts",
  "Confirm preflight returns READY",
  "Run USDC claim: npx tsx apps/web/scripts/test-live-claim.ts --token=usdc",
  "Verify balances changed correctly",
  "Run USDT claim: npx tsx apps/web/scripts/test-live-claim.ts --token=usdt",
  "Verify balances changed correctly",
  "Record tx hashes and screenshots",
] as const;

/* ══════════════════════════════════════════════════
   Reusable Section Components
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

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
         : "bg-red-500/10 border border-red-500/20 text-red-400"
    }`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{label}</span>
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
        <button
          onClick={copy}
          className="text-white/30 hover:text-white transition shrink-0"
          title="Copy to clipboard"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
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

function ChecklistItem({ label, index }: { label: string; index: number }) {
  const [checked, setChecked] = useState(false);
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 accent-emerald-500"
      />
      <span className={`text-sm ${checked ? "text-white/30 line-through" : "text-white/70 group-hover:text-white/90"}`}>
        {index + 1}. {label}
      </span>
    </label>
  );
}

/* ══════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════
   Live Proof Capture fields
   ══════════════════════════════════════════════════ */

const PROOF_FIELDS = [
  { key: "preflight", label: "Preflight Result", placeholder: "READY or BLOCKED" },
  { key: "wallet", label: "Wallet Used", placeholder: "0x…" },
  { key: "token", label: "Token Used", placeholder: "USDC or USDT" },
  { key: "txHash", label: "TX Hash", placeholder: "0x…" },
  { key: "balanceBefore", label: "Operator Stablecoin Balance Before", placeholder: "e.g. 110.00" },
  { key: "balanceAfter", label: "Operator Stablecoin Balance After", placeholder: "e.g. 10.00" },
  { key: "sgeBefore", label: "Contract SGE Before", placeholder: "e.g. 2000" },
  { key: "sgeAfter", label: "Contract SGE After", placeholder: "e.g. 1000" },
  { key: "verdict", label: "Pass / Fail Result", placeholder: "PASS or FAIL" },
] as const;

export default function OperatorTestingPage() {
  const [proof, setProof] = useState<Record<string, string>>({});

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8 px-4">
      {/* ── Mainnet Warning Banner ─────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.07] px-5 py-3">
        <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
        <span className="text-sm font-medium text-red-300">
          Live testing moves real funds on mainnet.
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Operator Testing</h1>
        <p className="mt-1 text-sm text-white/50">
          End-to-end live claim testing — wallets, balances, commands, verification
        </p>
      </div>

      {/* ── Section 1: System Status ───────────────── */}
      <SectionCard title="System Status" icon={Shield}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatusBadge ok={DEMO_MODE} label={`Demo Mode: ${DEMO_MODE ? "ON" : "OFF"}`} />
          <StatusBadge ok={!DEMO_MODE} label={`Live Mode: ${!DEMO_MODE ? "ACTIVE" : "INACTIVE"}`} />
        </div>

        <div className="space-y-2 text-sm text-white/60">
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 text-white/30 shrink-0" />
            <span><strong className="text-white/80">PRIVATE_KEY</strong> — required for CLI scripts. Set in <code className="text-emerald-400/70">apps/web/.env.local</code></span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 text-white/30 shrink-0" />
            <span><strong className="text-white/80">Contract funding</strong> — owner must load ≥ 1,000 SGE before claims work</span>
          </div>
          <div className="flex items-start gap-2">
            <ChevronRight className="w-4 h-4 mt-0.5 text-white/30 shrink-0" />
            <span><strong className="text-white/80">Wallet funding</strong> — operator wallet needs ETH + USDC or USDT</span>
          </div>
        </div>

        {DEMO_MODE && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-300">
              <strong>Demo mode is ON.</strong> All chain calls are simulated. Set{" "}
              <code className="text-amber-200">NEXT_PUBLIC_DEMO_MODE=false</code> in{" "}
              <code className="text-amber-200">apps/web/.env.local</code> and restart for live testing.
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Section 2: Required Wallets ────────────── */}
      <SectionCard title="Required Wallets" icon={Wallet}>
        <div className="space-y-4">
          {WALLETS.map((w) => (
            <div key={w.role} className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{w.role}</h3>
                {w.address && <AddressLink address={w.address} />}
                {!w.address && <span className="text-xs text-white/30 italic">Set via PRIVATE_KEY</span>}
              </div>
              <p className="text-xs text-white/50">{w.purpose}</p>
              <ul className="space-y-1">
                {w.needs.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-white/40">
                    <CircleDot className="w-3 h-3 text-white/20" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Section 3: Required Assets / Balances ──── */}
      <SectionCard title="Required Assets / Balances" icon={Coins}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/[0.06]">
                <th className="pb-2 pr-4">Entity</th>
                <th className="pb-2 pr-4">Asset</th>
                <th className="pb-2 pr-4">Minimum</th>
                <th className="pb-2 pr-4">Recommended</th>
                <th className="pb-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {REQUIRED_BALANCES.map((b, i) => (
                <tr key={i} className="border-b border-white/[0.03] text-white/60">
                  <td className="py-2 pr-4">{b.entity}</td>
                  <td className="py-2 pr-4 font-mono text-emerald-400/70">{b.asset}</td>
                  <td className="py-2 pr-4">{b.minimum}</td>
                  <td className="py-2 pr-4">{b.recommended}</td>
                  <td className="py-2 text-white/40">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section 4: Required ENV ────────────────── */}
      <SectionCard title="Required ENV" icon={Terminal}>
        <p className="text-xs text-white/40">
          Source: <code className="text-emerald-400/60">apps/web/.env.local</code> — template at{" "}
          <code className="text-emerald-400/60">apps/web/.env.example</code>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/[0.06]">
                <th className="pb-2 pr-4">Variable</th>
                <th className="pb-2 pr-4">Required</th>
                <th className="pb-2 pr-4">Default / Value</th>
                <th className="pb-2">Scope</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ENV_VARS).map(([name, v]) => (
                <tr key={name} className="border-b border-white/[0.03] text-white/60">
                  <td className="py-2 pr-4 font-mono text-xs text-emerald-400/70">{name}</td>
                  <td className="py-2 pr-4">
                    {v.required ? (
                      <span className="text-amber-400 text-xs">Required</span>
                    ) : (
                      <span className="text-white/30 text-xs">Optional</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-white/40 break-all">
                    {v.default ?? <span className="text-red-400 italic">MANUAL INPUT REQUIRED</span>}
                  </td>
                  <td className="py-2 text-xs text-white/40">{v.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section 5: Preflight Command ───────────── */}
      <SectionCard title="Preflight Command" icon={Shield}>
        <CommandBlock
          command="npx tsx apps/web/scripts/preflight-claim.ts"
          description="Read-only check — no transactions, no gas spent"
        />
        <div className="text-sm text-white/50 space-y-1">
          <p className="text-white/70 font-medium">Checks performed:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-white/40">
            <li>• ENV vars present</li>
            <li>• Chain ID = 1 (Mainnet)</li>
            <li>• Wallet address resolved</li>
            <li>• ETH balance ≥ 0.02</li>
            <li>• USDC balance ≥ 100</li>
            <li>• USDT balance ≥ 100</li>
            <li>• USDC/USDT allowances</li>
            <li>• CLAIM_AMOUNT() = 1000 SGE</li>
            <li>• hasClaimed() = false</li>
            <li>• Contract SGE ≥ 1,000</li>
            <li>• Contract owner address</li>
            <li>• READY vs BLOCKED verdict</li>
          </ul>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="text-emerald-400 font-mono">Exit 0</span> = READY &nbsp;|&nbsp;
          <span className="text-red-400 font-mono">Exit 1</span> = BLOCKED
        </div>
      </SectionCard>

      {/* ── Section 6: Live Test Commands ──────────── */}
      <SectionCard title="Live Test Commands" icon={Zap}>
        <div className="space-y-3">
          <CommandBlock
            command="npx tsx apps/web/scripts/test-live-claim.ts --token=usdc"
            description="Claim with USDC — executes real mainnet transaction"
          />
          <CommandBlock
            command="npx tsx apps/web/scripts/test-live-claim.ts --token=usdt"
            description="Claim with USDT — includes zero-first approval pattern"
          />
        </div>
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm text-red-300">
            These commands spend <strong>real tokens on mainnet</strong>. Each call costs 100 USDC/USDT + gas.
            Run preflight first.
          </div>
        </div>
      </SectionCard>

      {/* ── Section 7: Expected Transaction Flow ───── */}
      <SectionCard title="Expected Transaction Flow" icon={ArrowRight}>
        <ol className="space-y-2">
          {TX_FLOW_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/60">
              <span className="shrink-0 w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-xs text-white/40 font-mono">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      {/* ── Section 8: Pass / Fail Verification ────── */}
      <SectionCard title="Pass / Fail Verification" icon={CheckCircle2}>
        <p className="text-sm text-white/50">A real pass means all of the following are true:</p>
        <ul className="space-y-2">
          {PASS_CRITERIA.map((c, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-white/60">
              <CheckCircle2 className="w-4 h-4 text-emerald-400/60 shrink-0" />
              {c}
            </li>
          ))}
        </ul>
      </SectionCard>

      {/* ── Section 9: Failure Modes ───────────────── */}
      <SectionCard title="Known Failure Modes" icon={Ban}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/[0.06]">
                <th className="pb-2 pr-4">Blocker</th>
                <th className="pb-2 pr-4">Cause</th>
                <th className="pb-2">Fix</th>
              </tr>
            </thead>
            <tbody>
              {FAILURE_MODES.map((f, i) => (
                <tr key={i} className="border-b border-white/[0.03] text-white/60">
                  <td className="py-2 pr-4 text-red-400/80 font-medium text-xs">{f.blocker}</td>
                  <td className="py-2 pr-4 text-xs">{f.cause}</td>
                  <td className="py-2 text-xs text-white/40">{f.fix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section 10: Operator Checklist ──────────── */}
      <SectionCard title="Operator Checklist" icon={ClipboardCheck}>
        <p className="text-xs text-white/40">Check each item as you complete it. Progress is local to this tab.</p>
        <div className="space-y-3">
          {OPERATOR_CHECKLIST.map((item, i) => (
            <ChecklistItem key={i} label={item} index={i} />
          ))}
        </div>
      </SectionCard>

      {/* ── Section 11: Live Proof Capture ──────── */}
      <SectionCard title="Live Proof Capture" icon={FileText}>
        <p className="text-xs text-white/40">
          Record your live test results here. These values stay in this browser tab — copy them before closing.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROOF_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs font-medium text-white/50">{f.label}</label>
              <input
                type="text"
                placeholder={f.placeholder}
                value={proof[f.key] ?? ""}
                onChange={(e) => setProof((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 font-mono"
              />
            </div>
          ))}
        </div>

        {/* Verdict summary */}
        {proof.verdict && (
          <div className={`flex items-center gap-3 rounded-lg p-4 border ${
            proof.verdict.toUpperCase() === "PASS"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
              : "border-red-500/20 bg-red-500/5 text-red-400"
          }`}>
            {proof.verdict.toUpperCase() === "PASS"
              ? <CheckCircle2 className="w-5 h-5" />
              : <XCircle className="w-5 h-5" />}
            <div className="text-sm">
              <strong>{proof.verdict.toUpperCase()}</strong>
              {proof.txHash && (
                <span className="ml-2 text-xs opacity-70">
                  TX: <a href={`https://etherscan.io/tx/${proof.txHash}`} target="_blank" rel="noopener noreferrer" className="underline">{proof.txHash.slice(0, 10)}…{proof.txHash.slice(-8)}</a>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Copy all proof data */}
        <button
          onClick={() => {
            const lines = PROOF_FIELDS.map((f) => `${f.label}: ${proof[f.key] ?? "(not set)"}`);
            navigator.clipboard.writeText(lines.join("\n"));
          }}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white/70 transition"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy all proof fields to clipboard
        </button>
      </SectionCard>

      {/* ── Contract Reference ─────────────────────── */}
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.005] p-6 space-y-3">
        <h2 className="text-sm font-semibold text-white/40">Contract Reference</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">Claim Contract:</span>
            <AddressLink address={SGE_CONFIG.claimContract} />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">SGE Token:</span>
            <AddressLink address={SGE_CONFIG.sgeToken} />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">USDC:</span>
            <AddressLink address={SGE_CONFIG.tokens.USDC.address} />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">USDT:</span>
            <AddressLink address={SGE_CONFIG.tokens.USDT.address} />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">Owner:</span>
            <AddressLink address={SGE_CONFIG.contractOwner} />
          </div>
          <div className="flex items-center gap-2 text-white/40">
            <span className="text-white/60">Chain:</span>
            <span className="text-white/50">Ethereum Mainnet (ID 1)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-center text-white/20">
        SGE Alignment OS — Operator Testing Surface — All values sourced from repo config
      </p>
    </div>
  );
}
