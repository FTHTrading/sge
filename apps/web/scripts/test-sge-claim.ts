#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script; ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// test-sge-claim.ts
// ─────────────────────────────────────────────
// Executes a real claim via the SgeDistributor
// on Ethereum Mainnet, or runs a dry-run simulation.
//
// Modes:
//   DRY_RUN=true   — read-only checks, no tx sent
//   DRY_RUN=false  — executes claimExact() on-chain
//
// Required env:
//   MAINNET_RPC_URL          — Ethereum mainnet RPC
//   PRIVATE_KEY              — claimer wallet
//   SGE_DISTRIBUTOR_ADDRESS  — deployed SgeDistributor
//
// Optional env:
//   DRY_RUN                  — "true" | "false" (default: true)
//
// Usage:
//   MAINNET_RPC_URL=... PRIVATE_KEY=... DRY_RUN=false \
//     npx ts-node scripts/test-sge-claim.ts
// ─────────────────────────────────────────────

import { ethers } from "ethers";
import {
  LEGACY_ADDRESSES,
  DISTRIBUTOR_ABI,
  ERC20_ABI,
  requireEnv,
  getWallet,
  getProvider,
} from "../src/lib/sge-legacy/script-config";

async function main() {
  const isDryRun = (process.env.DRY_RUN ?? "true").toLowerCase() === "true";

  console.log("╔══════════════════════════════════════════════╗");
  console.log(`║   SGE Legacy — ${isDryRun ? "Claim DRY RUN" : "LIVE Claim Test"}             ║`);
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  if (!isDryRun) {
    console.log("🔴 LIVE MODE — this will send a real transaction on mainnet.");
    console.log();
  }

  const distAddr = requireEnv("SGE_DISTRIBUTOR_ADDRESS");
  const wallet = getWallet();
  const claimer = await wallet.getAddress();
  const provider = wallet.provider!;

  const token = new ethers.Contract(LEGACY_ADDRESSES.sgeToken, ERC20_ABI, provider);
  const dist = new ethers.Contract(distAddr, DISTRIBUTOR_ABI, provider);

  // ── Pre-claim diagnostics ──────────────────

  console.log("─── Pre-Claim Diagnostics ───");
  console.log();

  // 1. Claimer info
  const claimerEth = await provider.getBalance(claimer);
  const claimerSge = await token.balanceOf(claimer);
  console.log(`Claimer:      ${claimer}`);
  console.log(`  ETH:        ${ethers.formatEther(claimerEth)}`);
  console.log(`  SGE:        ${ethers.formatUnits(claimerSge, 18)}`);
  console.log();

  // 2. Distributor state
  const paused = await dist.paused();
  const inventory = await dist.inventoryBalance();
  const claimAmount = await dist.claimAmount();
  const alreadyClaimed = await dist.hasClaimed(claimer);

  console.log(`Distributor:  ${distAddr}`);
  console.log(`  Paused:     ${paused}`);
  console.log(`  Inventory:  ${ethers.formatUnits(inventory, 18)} SGE`);
  console.log(`  Claim Amt:  ${ethers.formatUnits(claimAmount, 18)} SGE`);
  console.log(`  Already claimed: ${alreadyClaimed}`);
  console.log();

  // ── Eligibility checks ─────────────────────

  const issues: string[] = [];

  if (paused) issues.push("Distributor is PAUSED");
  if (alreadyClaimed) issues.push("Wallet has ALREADY CLAIMED");
  if (inventory < claimAmount) issues.push("Inventory insufficient for one claim");
  if (claimerEth < ethers.parseEther("0.005")) issues.push("Insufficient ETH for gas");

  if (issues.length > 0) {
    console.log("❌ CLAIM BLOCKED — issues found:");
    for (const issue of issues) {
      console.log(`   • ${issue}`);
    }
    console.log();
    if (!isDryRun) {
      console.error("Cannot proceed with live claim. Fix issues above.");
      process.exit(1);
    } else {
      console.log("(Dry run — showing what would fail)");
    }
  } else {
    console.log("✅ All eligibility checks passed.");
  }

  // ── Execute claim ──────────────────────────

  if (isDryRun) {
    console.log();
    console.log("─── DRY RUN COMPLETE ───");
    console.log();
    console.log("To execute a real claim:");
    console.log("  DRY_RUN=false npx ts-node scripts/test-sge-claim.ts");
    return;
  }

  if (issues.length > 0) {
    // Already exited above for live mode, but safety
    process.exit(1);
  }

  console.log();
  console.log("─── Executing claimExact() ───");
  console.log();

  const distSigner = new ethers.Contract(distAddr, DISTRIBUTOR_ABI, wallet);

  // Gas estimation
  try {
    const estimatedGas = await distSigner.claimExact.estimateGas();
    console.log(`Estimated gas: ${estimatedGas.toString()}`);
  } catch (e: any) {
    console.error(`❌ Gas estimation failed: ${e.message}`);
    console.error("The transaction would likely revert. Aborting.");
    process.exit(1);
  }

  // Send transaction
  const tx = await distSigner.claimExact();
  console.log(`TX sent: ${tx.hash}`);
  console.log("Waiting for confirmation (2 blocks)...");

  const receipt = await tx.wait(2);

  if (receipt.status !== 1) {
    console.error(`❌ Transaction REVERTED. TX: ${receipt.hash}`);
    process.exit(1);
  }

  // ── Post-claim verification ────────────────

  console.log();
  console.log("─── Post-Claim Verification ───");
  console.log();

  const newClaimerSge = await token.balanceOf(claimer);
  const newInventory = await dist.inventoryBalance();
  const nowClaimed = await dist.hasClaimed(claimer);
  const delta = newClaimerSge - claimerSge;

  console.log(`Claimer SGE:     ${ethers.formatUnits(claimerSge, 18)} → ${ethers.formatUnits(newClaimerSge, 18)}`);
  console.log(`Delta:           +${ethers.formatUnits(delta, 18)} SGE`);
  console.log(`Inventory:       ${ethers.formatUnits(inventory, 18)} → ${ethers.formatUnits(newInventory, 18)}`);
  console.log(`hasClaimed:      ${alreadyClaimed} → ${nowClaimed}`);
  console.log();

  // Verify amounts match
  if (delta === claimAmount) {
    console.log("✅ CLAIM VERIFIED — received exactly the expected amount.");
  } else {
    console.log(`⚠️  CLAIM AMOUNT MISMATCH — expected ${ethers.formatUnits(claimAmount, 18)}, got ${ethers.formatUnits(delta, 18)}`);
  }

  console.log();
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║             CLAIM COMPLETE                   ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  TX Hash:    ${receipt.hash}`);
  console.log(`║  Block:      ${receipt.blockNumber}`);
  console.log(`║  Gas Used:   ${receipt.gasUsed.toString()}`);
  console.log(`║  Received:   ${ethers.formatUnits(delta, 18)} SGE`);
  console.log("╚══════════════════════════════════════════════╝");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
