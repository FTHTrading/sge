#!/usr/bin/env npx tsx
// ─────────────────────────────────────────────
// SGE Preflight Claim Check
// ─────────────────────────────────────────────
// Usage:
//   npx tsx apps/web/scripts/preflight-claim.ts
//
// Env:
//   MAINNET_RPC_URL  — Ethereum RPC (default: https://eth.llamarpc.com)
//   PRIVATE_KEY      — Wallet private key (to derive address)
//
// If PRIVATE_KEY is not set, reads WALLET_ADDRESS instead.
//
// Prints: chain id, wallet, balances, contract status, verdict.

import { JsonRpcProvider, Wallet, Contract, formatEther, formatUnits } from "ethers";

// ── Addresses (source of truth) ─────────────

const CLAIM_CONTRACT = process.env.CLAIM_CONTRACT_ADDRESS ?? "0x4BFeF695a5f85a65E1Aa6015439f317494477D09";
const SGE_TOKEN      = process.env.SGE_TOKEN_ADDRESS      ?? "0x40489719E489782959486A04B765E1e93e5B221a";
const USDC_TOKEN     = process.env.USDC_TOKEN_ADDRESS      ?? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_TOKEN     = process.env.USDT_TOKEN_ADDRESS      ?? "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

const CLAIM_ABI = [
  "function hasClaimed(address) view returns (bool)",
  "function CLAIM_AMOUNT() view returns (uint256)",
  "function owner() view returns (address)",
  "function sgeToken() view returns (address)",
  "function usdcToken() view returns (address)",
  "function usdtToken() view returns (address)",
];

// ── Thresholds ──────────────────────────────

const MIN_ETH = 0.02;
const EXACT_STABLE = 100_000_000n;   // 100 USDC/USDT (6 decimals)
const MARGIN_STABLE = 110_000_000n;  // recommended margin
const MIN_SGE = 1000n * 10n ** 18n;
const REC_SGE = 2000n * 10n ** 18n;

// ── Main ────────────────────────────────────

async function main() {
  const rpcUrl = process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com";
  const provider = new JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });

  // Derive wallet address
  let walletAddress: string;
  if (process.env.PRIVATE_KEY) {
    const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
    walletAddress = wallet.address;
  } else if (process.env.WALLET_ADDRESS) {
    walletAddress = process.env.WALLET_ADDRESS;
  } else {
    console.error("ERROR: Set PRIVATE_KEY or WALLET_ADDRESS in .env.local");
    process.exit(1);
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  SGE Preflight Claim Check                        ║");
  console.log("╚═══════════════════════════════════════════════════╝");
  console.log();

  // 1. Chain
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`  Chain ID:       ${chainId}${chainId === 1 ? " ✅" : " ❌ WRONG NETWORK"}`);
  if (chainId !== 1) blockers.push("wrong_network");

  // 2. Wallet
  console.log(`  Wallet:         ${walletAddress}`);
  console.log(`  RPC:            ${rpcUrl}`);
  console.log();

  // 3. ETH balance
  const ethBal = await provider.getBalance(walletAddress);
  const ethHuman = Number(formatEther(ethBal));
  const ethOk = ethHuman >= MIN_ETH;
  console.log(`  ETH Balance:    ${ethHuman.toFixed(6)} ETH  ${ethOk ? "✅" : "❌ Need ≥ 0.02 ETH"}`);
  if (!ethOk) blockers.push("no_gas");

  // 4. USDC balance
  const usdc = new Contract(USDC_TOKEN, ERC20_ABI, provider);
  const usdcBal: bigint = await (usdc.balanceOf as Function)(walletAddress);
  const usdcHuman = formatUnits(usdcBal, 6);
  const usdcOk = usdcBal >= EXACT_STABLE;
  console.log(`  USDC Balance:   ${usdcHuman} USDC  ${usdcOk ? "✅" : "⚪ Need ≥ 100"}`);
  if (!usdcOk) blockers.push("insufficient_usdc");
  else if (usdcBal < MARGIN_STABLE) warnings.push("USDC below recommended 110 margin");

  // 5. USDT balance
  const usdt = new Contract(USDT_TOKEN, ERC20_ABI, provider);
  const usdtBal: bigint = await (usdt.balanceOf as Function)(walletAddress);
  const usdtHuman = formatUnits(usdtBal, 6);
  const usdtOk = usdtBal >= EXACT_STABLE;
  console.log(`  USDT Balance:   ${usdtHuman} USDT  ${usdtOk ? "✅" : "⚪ Need ≥ 100"}`);
  if (!usdtOk) blockers.push("insufficient_usdt");
  else if (usdtBal < MARGIN_STABLE) warnings.push("USDT below recommended 110 margin");

  // 6. Allowances
  console.log();
  const usdcAllow: bigint = await (usdc.allowance as Function)(walletAddress, CLAIM_CONTRACT);
  console.log(`  USDC Allowance: ${formatUnits(usdcAllow, 6)} USDC → Claim  ${usdcAllow >= EXACT_STABLE ? "✅ Approved" : "⚪ Not approved"}`);
  const usdtAllow: bigint = await (usdt.allowance as Function)(walletAddress, CLAIM_CONTRACT);
  console.log(`  USDT Allowance: ${formatUnits(usdtAllow, 6)} USDT → Claim  ${usdtAllow >= EXACT_STABLE ? "✅ Approved" : "⚪ Not approved"}`);

  // 7. Contract reads
  console.log();
  const claim = new Contract(CLAIM_CONTRACT, CLAIM_ABI, provider);

  const claimAmount: bigint = await (claim.CLAIM_AMOUNT as Function)();
  console.log(`  Claim Reward:   ${formatUnits(claimAmount, 18)} SGE`);

  const hasClaimed: boolean = await (claim.hasClaimed as Function)(walletAddress);
  console.log(`  Has Claimed:    ${hasClaimed ? "✅ Yes — already claimed" : "⚪ No — eligible"}`);
  if (hasClaimed) blockers.push("already_claimed");

  const owner: string = await (claim.owner as Function)();
  console.log(`  Contract Owner: ${owner}`);

  // 8. Contract SGE balance
  const sge = new Contract(SGE_TOKEN, ERC20_ABI, provider);
  const contractSge: bigint = await (sge.balanceOf as Function)(CLAIM_CONTRACT);
  const contractSgeHuman = formatUnits(contractSge, 18);
  const funded = contractSge >= MIN_SGE;
  console.log(`  Contract SGE:   ${contractSgeHuman} SGE  ${funded ? "✅ Funded" : "❌ DRAINED"}`);
  if (!funded) blockers.push("contract_drained");
  else if (contractSge < REC_SGE) warnings.push("Contract SGE below recommended 2,000");

  // ── Verdict ───────────────────────────────

  console.log();
  console.log("─".repeat(55));

  // Critical = everything except insufficient_usdc / insufficient_usdt
  const critical = blockers.filter((b) => b !== "insufficient_usdc" && b !== "insufficient_usdt");
  const hasUsdc = !blockers.includes("insufficient_usdc");
  const hasUsdt = !blockers.includes("insufficient_usdt");
  const hasAnyStable = hasUsdc || hasUsdt;

  if (critical.length === 0 && hasAnyStable) {
    console.log("  ✅ VERDICT: READY");
    if (hasUsdc) console.log("     → Can claim with USDC");
    if (hasUsdt) console.log("     → Can claim with USDT");
    if (warnings.length > 0) {
      console.log();
      warnings.forEach((w) => console.log(`  ⚠️  ${w}`));
    }
  } else {
    console.log("  ❌ VERDICT: BLOCKED");
    blockers.forEach((b) => {
      const labels: Record<string, string> = {
        wrong_network: "Wrong network — must be Ethereum Mainnet",
        no_gas: "Insufficient ETH for gas (need ≥ 0.02 ETH)",
        insufficient_usdc: "Insufficient USDC (need ≥ 100)",
        insufficient_usdt: "Insufficient USDT (need ≥ 100)",
        contract_drained: "Contract drained — no SGE to distribute",
        already_claimed: "Wallet has already claimed",
      };
      console.log(`     ❌ ${labels[b] ?? b}`);
    });
  }

  console.log("─".repeat(55));
  console.log();

  process.exit(critical.length === 0 && hasAnyStable ? 0 : 1);
}

main().catch((err) => {
  console.error("Preflight error:", err.message);
  process.exit(1);
});
