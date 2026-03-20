#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script
// ─────────────────────────────────────────────
// verify-sge-contracts.ts
// ─────────────────────────────────────────────
// Verifies all 3 SGE contracts on Etherscan.
// Uses Hardhat's built-in verification or falls
// back to printing constructor args for manual
// verification.
//
// Required env:
//   ETHERSCAN_API_KEY   — from etherscan.io
//   MAINNET_RPC_URL     — Ethereum mainnet RPC
//
// Contract addresses from env or deployment-manifest.json.
//
// Usage:
//   ETHERSCAN_API_KEY=... npx ts-node scripts/verify-sge-contracts.ts
// ─────────────────────────────────────────────

import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  LEGACY_ADDRESSES,
  requireEnv,
  getProvider,
} from "../src/lib/sge-legacy/script-config";

// ── Types ────────────────────────────────────

interface VerificationTarget {
  name: string;
  address: string;
  constructorArgs: any[];
  /** Solidity source file path relative to contracts/ */
  contract: string;
}

// ── Main ─────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   SGE Legacy — Etherscan Verification       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    console.warn("⚠️  ETHERSCAN_API_KEY not set. Will print constructor args for manual verification.\n");
  }

  const provider = getProvider();

  // Resolve addresses
  const distAddr = LEGACY_ADDRESSES.distributor;
  const vaultAddr = LEGACY_ADDRESSES.treasury;
  const amAddr = LEGACY_ADDRESSES.accessManager;
  const tokenAddr = LEGACY_ADDRESSES.sgeToken;
  const adminAddr = LEGACY_ADDRESSES.admin;

  // Try to read claim amount from distributor
  let claimAmount = ethers.parseUnits("1000", 18); // default
  if (distAddr) {
    try {
      const dist = new ethers.Contract(
        distAddr,
        ["function claimAmount() view returns (uint256)"],
        provider
      );
      claimAmount = await dist.claimAmount();
    } catch {
      console.warn("⚠️  Could not read claimAmount from distributor; using default 1000 SGE.\n");
    }
  }

  // Build verification targets
  const targets: VerificationTarget[] = [];

  if (amAddr) {
    targets.push({
      name: "SgeAccessManager",
      address: amAddr,
      constructorArgs: [adminAddr],
      contract: "contracts/SgeAccessManager.sol:SgeAccessManager",
    });
  }

  if (vaultAddr) {
    targets.push({
      name: "SgeTreasuryVault",
      address: vaultAddr,
      constructorArgs: [tokenAddr, adminAddr],
      contract: "contracts/SgeTreasuryVault.sol:SgeTreasuryVault",
    });
  }

  if (distAddr) {
    targets.push({
      name: "SgeDistributor",
      address: distAddr,
      constructorArgs: [tokenAddr, vaultAddr, claimAmount.toString(), adminAddr],
      contract: "contracts/SgeDistributor.sol:SgeDistributor",
    });
  }

  if (targets.length === 0) {
    console.error("❌ No contract addresses configured. Set env vars or run deploy script first.");
    process.exit(1);
  }

  // ── Verify each contract ───────────────────

  for (const target of targets) {
    console.log(`\n┌─── ${target.name} ────────────────────────────┐`);
    console.log(`│  Address: ${target.address}`);
    console.log(`│  Contract: ${target.contract}`);
    console.log(`│  Constructor Args:`);

    // ABI-encode constructor args
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const argTypes = getArgTypes(target.name);
    const encoded = abiCoder.encode(argTypes, target.constructorArgs);

    target.constructorArgs.forEach((arg, i) => {
      console.log(`│    [${i}] ${argTypes[i]}: ${arg}`);
    });
    console.log(`│  ABI-Encoded Args:`);
    console.log(`│    ${encoded}`);

    // Check if already verified
    if (apiKey) {
      const verified = await checkVerificationStatus(target.address, apiKey);
      if (verified) {
        console.log(`│  ✅ Already verified on Etherscan`);
        console.log(`└${"─".repeat(48)}┘`);
        continue;
      }
    }

    // Attempt Hardhat verify
    if (apiKey) {
      console.log(`│  ⏳ Submitting verification to Etherscan...`);
      try {
        await verifyViaHardhat(target);
        console.log(`│  ✅ Verification submitted successfully`);
      } catch (e: any) {
        if (e.message?.includes("Already Verified")) {
          console.log(`│  ✅ Already verified`);
        } else {
          console.log(`│  ❌ Hardhat verify failed: ${e.message}`);
          console.log(`│  💡 Try manual verification at:`);
          console.log(`│     https://etherscan.io/verifyContract?a=${target.address}`);
        }
      }
    } else {
      console.log(`│  💡 Manual verification URL:`);
      console.log(`│     https://etherscan.io/verifyContract?a=${target.address}`);
      console.log(`│  📋 Paste the ABI-encoded constructor args above.`);
      console.log(`│     Compiler: v0.8.20+commit.a1b79de6`);
      console.log(`│     Optimizer: enabled, 200 runs`);
      console.log(`│     EVM Target: paris`);
    }

    console.log(`└${"─".repeat(48)}┘`);
  }

  // ── Summary ────────────────────────────────

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║           VERIFICATION SUMMARY               ║");
  console.log("╠══════════════════════════════════════════════╣");
  for (const t of targets) {
    const etherscanUrl = `https://etherscan.io/address/${t.address}#code`;
    console.log(`║  ${t.name.padEnd(20)} ${t.address}`);
    console.log(`║  ${"".padEnd(20)} ${etherscanUrl}`);
  }
  console.log("╚══════════════════════════════════════════════╝");

  // Write verification record
  const verifyRecord = {
    timestamp: new Date().toISOString(),
    apiKeyPresent: !!apiKey,
    targets: targets.map((t) => ({
      name: t.name,
      address: t.address,
      contract: t.contract,
      constructorArgs: t.constructorArgs.map(String),
    })),
    compiler: {
      version: "v0.8.20+commit.a1b79de6",
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  };

  const recordPath = path.resolve(__dirname, "../verification-record.json");
  fs.writeFileSync(recordPath, JSON.stringify(verifyRecord, null, 2));
  console.log(`\nVerification record saved to: ${recordPath}`);
}

// ── Helpers ──────────────────────────────────

function getArgTypes(contractName: string): string[] {
  switch (contractName) {
    case "SgeAccessManager":
      return ["address"]; // _admin
    case "SgeTreasuryVault":
      return ["address", "address"]; // _sgeToken, _admin
    case "SgeDistributor":
      return ["address", "address", "uint256", "address"]; // _sgeToken, _treasury, _claimAmount, _admin
    default:
      return [];
  }
}

async function checkVerificationStatus(
  address: string,
  apiKey: string
): Promise<boolean> {
  try {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.status === "1" && data.result !== "Contract source code not verified";
  } catch {
    return false;
  }
}

async function verifyViaHardhat(target: VerificationTarget): Promise<void> {
  // Use child_process to invoke hardhat verify
  const { execSync } = require("node:child_process");

  const args = target.constructorArgs.map(String).join(" ");
  const cmd = `npx hardhat verify --network mainnet --contract ${target.contract} ${target.address} ${args}`;

  console.log(`│  CMD: ${cmd}`);
  execSync(cmd, { stdio: "pipe", encoding: "utf-8" });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
