#!/usr/bin/env npx tsx
// ─────────────────────────────────────────────
// SGE Instant Settlement Script
// ─────────────────────────────────────────────
// Sends ETH + SGE tokens to the target wallet in one shot.
//
// Usage:
//   npx tsx scripts/settle.ts --eth <amount> --sge <amount>
//
// Examples:
//   npx tsx scripts/settle.ts --eth 0.05 --sge 5000
//   npx tsx scripts/settle.ts --eth 0.1 --sge 10000
//   npx tsx scripts/settle.ts --sge 2500          # SGE only, skip ETH
//   npx tsx scripts/settle.ts --eth 0.02           # ETH only, skip SGE
//
// Required env (set in .env.local or export before running):
//   SENDER_PRIVATE_KEY  — private key of the funding wallet
//   RPC_URL             — Ethereum RPC (default: https://eth.llamarpc.com)
//
// Target wallet: 0x1FF7251B479818d0529b65d89AD314E47E5DA922

import * as fs from "fs";
import * as path from "path";
import {
  Wallet,
  JsonRpcProvider,
  Contract,
  parseEther,
  parseUnits,
  formatEther,
  formatUnits,
} from "ethers";

// ── Addresses ───────────────────────────────

const TARGET = "0x1FF7251B479818d0529b65d89AD314E47E5DA922";
const SGE_TOKEN = "0x40489719E489782959486A04B765E1e93e5B221a";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

// ── Load .env.local ─────────────────────────

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "../.env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvFile();

// ── Parse CLI args ──────────────────────────

function parseArgs(): { eth: string | null; sge: string | null } {
  const args = process.argv.slice(2);
  let eth: string | null = null;
  let sge: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--eth" && args[i + 1]) {
      eth = args[++i]!;
    } else if (args[i] === "--sge" && args[i + 1]) {
      sge = args[++i]!;
    }
  }

  if (!eth && !sge) {
    console.error("Usage: npx tsx scripts/settle.ts --eth <amount> --sge <amount>");
    console.error("  At least one of --eth or --sge is required.");
    console.error("\nExamples:");
    console.error("  npx tsx scripts/settle.ts --eth 0.05 --sge 5000");
    console.error("  npx tsx scripts/settle.ts --sge 2500");
    process.exit(1);
  }

  return { eth, sge };
}

// ── Main ────────────────────────────────────

async function main() {
  const { eth: ethAmount, sge: sgeAmount } = parseArgs();

  const privateKey = process.env.SENDER_PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || "https://eth.llamarpc.com";

  if (!privateKey) {
    console.error("❌ SENDER_PRIVATE_KEY not set.");
    console.error("   Set it in apps/web/.env.local or export it:");
    console.error("   export SENDER_PRIVATE_KEY=0x...");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });
  const sender = new Wallet(privateKey, provider);

  // ── Header ──────────────────────────────

  console.log();
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  SGE INSTANT SETTLEMENT                       ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log();
  console.log(`  Sender:  ${sender.address}`);
  console.log(`  Target:  ${TARGET}`);
  console.log(`  RPC:     ${rpcUrl}`);

  // Verify mainnet
  const network = await provider.getNetwork();
  if (network.chainId !== 1n) {
    console.error(`\n❌ Wrong chain (${network.chainId}). Must be Ethereum Mainnet (1).`);
    process.exit(1);
  }
  console.log(`  Chain:   Ethereum Mainnet ✅`);

  // ── Pre-flight balances ─────────────────

  const senderEth = await provider.getBalance(sender.address);
  const targetEth = await provider.getBalance(TARGET);
  const sgeContract = new Contract(SGE_TOKEN, ERC20_ABI, provider);
  const sgeDecimals: number = await (sgeContract.decimals as Function)();
  const sgeSymbol: string = await (sgeContract.symbol as Function)();
  const senderSge: bigint = await (sgeContract.balanceOf as Function)(sender.address);
  const targetSge: bigint = await (sgeContract.balanceOf as Function)(TARGET);

  console.log();
  console.log("  ─── Current Balances ───");
  console.log(`  Sender ETH:  ${formatEther(senderEth)}`);
  console.log(`  Sender ${sgeSymbol}:  ${formatUnits(senderSge, sgeDecimals)}`);
  console.log(`  Target ETH:  ${formatEther(targetEth)}`);
  console.log(`  Target ${sgeSymbol}:  ${formatUnits(targetSge, sgeDecimals)}`);

  // ── Validate sufficiency ────────────────

  const ethWei = ethAmount ? parseEther(ethAmount) : 0n;
  const sgeWei = sgeAmount ? parseUnits(sgeAmount, sgeDecimals) : 0n;

  console.log();
  console.log("  ─── Settlement Plan ───");
  if (ethAmount) console.log(`  → Send ${ethAmount} ETH`);
  if (sgeAmount) console.log(`  → Send ${sgeAmount} ${sgeSymbol}`);

  // Check ETH (need enough for transfer + gas for both txs)
  const gasBuffer = parseEther("0.005");
  const totalEthNeeded = ethWei + gasBuffer;
  if (senderEth < totalEthNeeded) {
    console.error(`\n❌ Insufficient ETH. Have ${formatEther(senderEth)}, need ~${formatEther(totalEthNeeded)} (incl. gas).`);
    process.exit(1);
  }

  if (sgeWei > 0n && senderSge < sgeWei) {
    console.error(`\n❌ Insufficient ${sgeSymbol}. Have ${formatUnits(senderSge, sgeDecimals)}, need ${sgeAmount}.`);
    process.exit(1);
  }

  // ── Countdown ───────────────────────────

  console.log();
  console.log("  ⚠️  Executing in 5 seconds... Ctrl+C to abort.");
  for (let i = 5; i > 0; i--) {
    process.stdout.write(`  ${i}...`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log(" GO\n");

  // ── Execute ─────────────────────────────

  const results: { type: string; hash: string; block: number }[] = [];

  // 1. ETH transfer
  if (ethWei > 0n) {
    console.log("  → Sending ETH...");
    const tx = await sender.sendTransaction({ to: TARGET, value: ethWei });
    console.log(`    TX: ${tx.hash}`);
    console.log(`    https://etherscan.io/tx/${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`    ✅ Confirmed block ${receipt!.blockNumber}`);
    results.push({ type: "ETH", hash: tx.hash, block: receipt!.blockNumber });
  }

  // 2. SGE transfer
  if (sgeWei > 0n) {
    console.log("  → Sending SGE...");
    const sgeWithSigner = new Contract(SGE_TOKEN, ERC20_ABI, sender);
    const tx = await (sgeWithSigner.transfer as Function)(TARGET, sgeWei);
    console.log(`    TX: ${tx.hash}`);
    console.log(`    https://etherscan.io/tx/${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`    ✅ Confirmed block ${receipt!.blockNumber}`);
    results.push({ type: sgeSymbol, hash: tx.hash, block: receipt!.blockNumber });
  }

  // ── Final balances ──────────────────────

  const finalTargetEth = await provider.getBalance(TARGET);
  const finalTargetSge: bigint = await (sgeContract.balanceOf as Function)(TARGET);

  console.log();
  console.log("  ═══════════════════════════════════════════");
  console.log("  ✅ SETTLEMENT COMPLETE");
  console.log("  ═══════════════════════════════════════════");
  console.log();
  console.log(`  Target: ${TARGET}`);
  console.log(`  ETH:    ${formatEther(finalTargetEth)}`);
  console.log(`  ${sgeSymbol}:    ${formatUnits(finalTargetSge, sgeDecimals)}`);
  console.log();
  for (const r of results) {
    console.log(`  ${r.type} → https://etherscan.io/tx/${r.hash}  (block ${r.block})`);
  }
  console.log();
  console.log(`  Wallet: https://etherscan.io/address/${TARGET}`);
  console.log();
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message || err);
  process.exit(1);
});
