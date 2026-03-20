#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script; ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// fund-sge-inventory.ts
// ─────────────────────────────────────────────
// Moves SGE tokens into the Distributor (or Vault)
// to make claims possible. Uses the legacy-safe
// approve+transfer pattern (zero-first approval).
//
// Required env:
//   MAINNET_RPC_URL          — Ethereum mainnet RPC
//   PRIVATE_KEY              — funder wallet (must hold SGE)
//   SGE_DISTRIBUTOR_ADDRESS  — deployed SgeDistributor
//
// Optional env:
//   SGE_FUND_AMOUNT          — amount in SGE (default: 10000)
//   SGE_FUND_TARGET          — "distributor" | "vault" (default: distributor)
//
// Usage:
//   MAINNET_RPC_URL=... PRIVATE_KEY=... SGE_FUND_AMOUNT=50000 \
//     npx ts-node scripts/fund-sge-inventory.ts
// ─────────────────────────────────────────────

import { ethers } from "ethers";
import {
  LEGACY_ADDRESSES,
  DISTRIBUTOR_ABI,
  VAULT_ABI,
  ERC20_ABI,
  requireEnv,
  getWallet,
} from "../src/lib/sge-legacy/script-config";

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   SGE Legacy — Fund Inventory               ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();
  console.log("⚠️  THIS MOVES REAL SGE TOKENS ON MAINNET");
  console.log();

  const wallet = getWallet();
  const funder = await wallet.getAddress();

  const fundAmount = ethers.parseUnits(
    process.env.SGE_FUND_AMOUNT ?? "10000",
    18
  );
  const target = (process.env.SGE_FUND_TARGET ?? "distributor").toLowerCase();

  // Resolve target address
  let targetAddr: string;
  let targetName: string;
  if (target === "vault") {
    targetAddr = requireEnv("SGE_TREASURY_ADDRESS");
    targetName = "TreasuryVault";
  } else {
    targetAddr = requireEnv("SGE_DISTRIBUTOR_ADDRESS");
    targetName = "Distributor";
  }

  const tokenAddr = LEGACY_ADDRESSES.sgeToken;
  const token = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);

  // ── Pre-flight checks ─────────────────────

  console.log(`Funder:   ${funder}`);
  console.log(`Target:   ${targetName} at ${targetAddr}`);
  console.log(`Amount:   ${ethers.formatUnits(fundAmount, 18)} SGE`);
  console.log();

  const funderBalance = await token.balanceOf(funder);
  console.log(`Funder SGE balance: ${ethers.formatUnits(funderBalance, 18)} SGE`);

  if (funderBalance < fundAmount) {
    console.error(`❌ Insufficient SGE balance. Need ${ethers.formatUnits(fundAmount, 18)}, have ${ethers.formatUnits(funderBalance, 18)}.`);
    process.exit(1);
  }

  const ethBalance = await wallet.provider!.getBalance(funder);
  console.log(`Funder ETH balance: ${ethers.formatEther(ethBalance)} ETH`);

  if (ethBalance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient ETH for gas.");
    process.exit(1);
  }

  // ── Step 1: Zero-first approval ────────────
  // Legacy SGE may have race condition on approve.
  // Always set allowance to 0 first.

  console.log("\nStep 1: Clearing existing allowance (zero-first)...");
  const currentAllowance = await token.allowance(funder, targetAddr);
  if (currentAllowance > 0n) {
    const zeroTx = await token.approve(targetAddr, 0);
    const zeroReceipt = await zeroTx.wait(2);
    if (zeroReceipt.status !== 1) {
      console.error("❌ Zero-approval transaction failed.");
      process.exit(1);
    }
    console.log(`  ✅ Allowance set to 0 (tx: ${zeroReceipt.hash})`);
  } else {
    console.log("  ✅ Allowance already 0");
  }

  console.log("Step 2: Approving target for transfer...");
  const approveTx = await token.approve(targetAddr, fundAmount);
  const approveReceipt = await approveTx.wait(2);
  if (approveReceipt.status !== 1) {
    console.error("❌ Approval transaction failed.");
    process.exit(1);
  }
  console.log(`  ✅ Approved ${ethers.formatUnits(fundAmount, 18)} SGE (tx: ${approveReceipt.hash})`);

  // ── Step 3: Fund the target ────────────────

  if (target === "vault") {
    console.log("Step 3: Depositing into TreasuryVault...");
    const vault = new ethers.Contract(targetAddr, VAULT_ABI, wallet);
    const depositTx = await vault.deposit(fundAmount);
    const depositReceipt = await depositTx.wait(2);
    if (depositReceipt.status !== 1) {
      console.error("❌ Vault deposit failed.");
      process.exit(1);
    }
    console.log(`  ✅ Deposited (tx: ${depositReceipt.hash})`);
  } else {
    console.log("Step 3: Funding Distributor inventory...");
    const dist = new ethers.Contract(targetAddr, DISTRIBUTOR_ABI, wallet);
    const fundTx = await dist.fundInventory(fundAmount);
    const fundReceipt = await fundTx.wait(2);
    if (fundReceipt.status !== 1) {
      console.error("❌ Fund inventory failed.");
      process.exit(1);
    }
    console.log(`  ✅ Funded (tx: ${fundReceipt.hash})`);
  }

  // ── Post-funding verification ──────────────

  console.log("\nVerifying...");
  const newFunderBalance = await token.balanceOf(funder);
  const newTargetBalance = await token.balanceOf(targetAddr);

  console.log();
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║             FUNDING COMPLETE                 ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Funded: ${ethers.formatUnits(fundAmount, 18).padEnd(16)} SGE → ${targetName}`);
  console.log(`║  Funder balance:  ${ethers.formatUnits(newFunderBalance, 18).padEnd(12)} SGE`);
  console.log(`║  ${targetName} balance: ${ethers.formatUnits(newTargetBalance, 18).padEnd(12)} SGE`);
  console.log("╚══════════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
