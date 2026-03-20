#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script; ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// deploy-sge-distributor.ts
// ─────────────────────────────────────────────
// Deploys the full SGE legacy infrastructure:
//   1. SgeAccessManager
//   2. SgeTreasuryVault
//   3. SgeDistributor
//
// Then links them: vault authorizes distributor,
// distributor sets treasury = vault.
//
// MAINNET DEPLOYMENT — requires funded wallet.
//
// Required env:
//   MAINNET_RPC_URL  — Ethereum mainnet RPC
//   PRIVATE_KEY      — deployer wallet private key
//
// Optional env:
//   SGE_CLAIM_AMOUNT — claim amount in SGE (default: 1000)
//
// Usage:
//   MAINNET_RPC_URL=... PRIVATE_KEY=... npx ts-node scripts/deploy-sge-distributor.ts
// ─────────────────────────────────────────────

import { ethers } from "ethers";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  LEGACY_ADDRESSES,
  requireEnv,
  getWallet,
} from "../src/lib/sge-legacy/script-config";

// ── Compiled Contract Artifacts ──────────────
// These must exist after running: npx hardhat compile
// or: forge build

function loadArtifact(contractName: string): { abi: any[]; bytecode: string } {
  // Try Hardhat artifacts first (monorepo root: 3 levels up from apps/web/scripts/)
  const hardhatPath = path.resolve(
    __dirname,
    `../../../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  if (fs.existsSync(hardhatPath)) {
    const artifact = JSON.parse(fs.readFileSync(hardhatPath, "utf-8"));
    return { abi: artifact.abi, bytecode: artifact.bytecode };
  }

  // Try Foundry out/ directory
  const foundryPath = path.resolve(
    __dirname,
    `../../../out/${contractName}.sol/${contractName}.json`
  );
  if (fs.existsSync(foundryPath)) {
    const artifact = JSON.parse(fs.readFileSync(foundryPath, "utf-8"));
    return { abi: artifact.abi, bytecode: artifact.bytecode.object ?? artifact.bytecode };
  }

  console.error(`ERROR: Cannot find compiled artifact for ${contractName}.`);
  console.error("Run 'npx hardhat compile' or 'forge build' first.");
  process.exit(1);
}

// ── Deploy Helpers ───────────────────────────

async function deployContract(
  wallet: ethers.Wallet,
  name: string,
  abi: any[],
  bytecode: string,
  args: any[]
): Promise<ethers.Contract> {
  console.log(`\nDeploying ${name}...`);
  console.log(`  Constructor args: ${JSON.stringify(args)}`);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(...args);
  const receipt = await contract.deploymentTransaction()!.wait(2);

  console.log(`  ✅ ${name} deployed at: ${await contract.getAddress()}`);
  console.log(`  TX: ${receipt!.hash}`);
  console.log(`  Gas used: ${receipt!.gasUsed.toString()}`);

  return contract as ethers.Contract;
}

// ── Main ─────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   SGE Legacy — Deploy Infrastructure        ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();
  console.log("⚠️  THIS DEPLOYS TO ETHEREUM MAINNET");
  console.log("⚠️  Real ETH will be spent on gas.");
  console.log();

  const wallet = getWallet();
  const deployer = await wallet.getAddress();
  const balance = await wallet.provider!.getBalance(deployer);

  console.log(`Deployer: ${deployer}`);
  console.log(`ETH Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`SGE Token: ${LEGACY_ADDRESSES.sgeToken}`);
  console.log();

  if (balance < ethers.parseEther("0.05")) {
    console.error("❌ Insufficient ETH for deployment (need at least 0.05 ETH).");
    process.exit(1);
  }

  const claimAmount = ethers.parseUnits(
    process.env.SGE_CLAIM_AMOUNT ?? "1000",
    18
  );

  // ── 1. Deploy SgeAccessManager ─────────────

  const amArtifact = loadArtifact("SgeAccessManager");
  const accessManager = await deployContract(
    wallet,
    "SgeAccessManager",
    amArtifact.abi,
    amArtifact.bytecode,
    [deployer] // _admin
  );
  const amAddr = await accessManager.getAddress();

  // ── 2. Deploy SgeTreasuryVault ─────────────

  const vaultArtifact = loadArtifact("SgeTreasuryVault");
  const vault = await deployContract(
    wallet,
    "SgeTreasuryVault",
    vaultArtifact.abi,
    vaultArtifact.bytecode,
    [LEGACY_ADDRESSES.sgeToken, deployer] // _sgeToken, _admin
  );
  const vaultAddr = await vault.getAddress();

  // ── 3. Deploy SgeDistributor ───────────────

  const distArtifact = loadArtifact("SgeDistributor");
  const distributor = await deployContract(
    wallet,
    "SgeDistributor",
    distArtifact.abi,
    distArtifact.bytecode,
    [
      LEGACY_ADDRESSES.sgeToken, // _sgeToken
      vaultAddr,                  // _treasury (= vault)
      claimAmount,                // _claimAmount
      deployer,                   // _admin
    ]
  );
  const distAddr = await distributor.getAddress();

  // ── 4. Link: Vault authorizes Distributor ──

  console.log("\nLinking: Vault → Distributor authorization...");
  const linkTx = await vault.setDistributor(distAddr, true);
  await linkTx.wait(2);
  console.log("  ✅ Vault authorized distributor");

  // ── 5. Print deployment summary ────────────

  const deploymentInfo = {
    network: "Ethereum Mainnet (chainId 1)",
    deployer,
    timestamp: new Date().toISOString(),
    contracts: {
      SgeAccessManager: amAddr,
      SgeTreasuryVault: vaultAddr,
      SgeDistributor: distAddr,
    },
    linkedToken: LEGACY_ADDRESSES.sgeToken,
    claimAmount: ethers.formatUnits(claimAmount, 18) + " SGE",
  };

  console.log();
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║             DEPLOYMENT COMPLETE              ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  AccessManager : ${amAddr}`);
  console.log(`║  TreasuryVault : ${vaultAddr}`);
  console.log(`║  Distributor   : ${distAddr}`);
  console.log(`║  SGE Token     : ${LEGACY_ADDRESSES.sgeToken}`);
  console.log(`║  Claim Amount  : ${deploymentInfo.claimAmount}`);
  console.log("╚══════════════════════════════════════════════╝");
  console.log();
  console.log("NEXT STEPS:");
  console.log("  1. Add to .env:");
  console.log(`     SGE_DISTRIBUTOR_ADDRESS=${distAddr}`);
  console.log(`     SGE_TREASURY_ADDRESS=${vaultAddr}`);
  console.log(`     SGE_ACCESS_MANAGER_ADDRESS=${amAddr}`);
  console.log("  2. Fund inventory: npx ts-node scripts/fund-sge-inventory.ts");
  console.log("  3. Run preflight: npx ts-node scripts/preflight-sge-legacy.ts");
  console.log();

  // Save deployment manifest to canonical location
  const manifestPath = path.resolve(__dirname, "../deployment-manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment manifest saved to: ${manifestPath}`);

  // Also save to monorepo root for Hardhat/CI access
  const rootManifestPath = path.resolve(__dirname, "../../../deployment-manifest.json");
  fs.writeFileSync(rootManifestPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Root manifest saved to: ${rootManifestPath}`);

  // Print env vars for easy copy-paste
  console.log();
  console.log("─── .env additions ───────────────────────────");
  console.log(`SGE_DISTRIBUTOR_ADDRESS=${distAddr}`);
  console.log(`SGE_TREASURY_ADDRESS=${vaultAddr}`);
  console.log(`SGE_ACCESS_MANAGER_ADDRESS=${amAddr}`);
  console.log(`SGE_ADMIN_ADDRESS=${deployer}`);
  console.log(`NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS=${distAddr}`);
  console.log(`NEXT_PUBLIC_SGE_TREASURY_ADDRESS=${vaultAddr}`);
  console.log(`NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS=${amAddr}`);
  console.log("───────────────────────────────────────────────");
}

main().catch((err) => {
  console.error("Fatal deployment error:", err);
  process.exit(1);
});
