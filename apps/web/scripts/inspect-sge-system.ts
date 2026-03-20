#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script; ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// inspect-sge-system.ts
// ─────────────────────────────────────────────
// Prints a comprehensive snapshot of the entire
// SGE legacy system: addresses, balances, roles,
// pause state, inventory, allowances, compliance
// config, and cross-contract links.
//
// Read-only — no state changes.
//
// Required env:
//   MAINNET_RPC_URL  — Ethereum mainnet RPC
//
// Usage:
//   MAINNET_RPC_URL=... npx ts-node scripts/inspect-sge-system.ts
// ─────────────────────────────────────────────

import { ethers } from "ethers";
import {
  LEGACY_ADDRESSES,
  DISTRIBUTOR_ABI,
  VAULT_ABI,
  ACCESS_MANAGER_ABI,
  ERC20_ABI,
  getProvider,
} from "../src/lib/sge-legacy/script-config";

function section(title: string) {
  console.log();
  console.log(`┌─── ${title} ${"─".repeat(Math.max(0, 40 - title.length))}┐`);
}

function row(label: string, value: string) {
  console.log(`│  ${label.padEnd(22)} ${value}`);
}

function sectionEnd() {
  console.log(`└${"─".repeat(46)}┘`);
}

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   SGE Legacy — System Inspection            ║");
  console.log("╚══════════════════════════════════════════════╝");

  const provider = getProvider();
  const network = await provider.getNetwork();

  // ── Network ────────────────────────────────

  section("Network");
  row("Chain ID", network.chainId.toString());
  row("Block", (await provider.getBlockNumber()).toLocaleString());
  sectionEnd();

  // ── Addresses ──────────────────────────────

  section("Configured Addresses");
  row("SGE Token", LEGACY_ADDRESSES.sgeToken || "(not set)");
  row("Distributor", LEGACY_ADDRESSES.distributor || "(not set)");
  row("Treasury Vault", LEGACY_ADDRESSES.treasury || "(not set)");
  row("Access Manager", LEGACY_ADDRESSES.accessManager || "(not set)");
  row("Admin", LEGACY_ADDRESSES.admin || "(not set)");
  row("Operator", LEGACY_ADDRESSES.operator || "(not set)");
  row("Claim Contract", LEGACY_ADDRESSES.claimContract || "(not set)");
  sectionEnd();

  // ── Token Info ─────────────────────────────

  if (LEGACY_ADDRESSES.sgeToken) {
    const token = new ethers.Contract(LEGACY_ADDRESSES.sgeToken, ERC20_ABI, provider);

    section("SGE Token");
    try {
      const [symbol, decimals] = await Promise.all([
        token.symbol(),
        token.decimals(),
      ]);
      row("Symbol", symbol);
      row("Decimals", decimals.toString());
    } catch (e: any) {
      row("Error", e.message);
    }

    // Balances
    const balanceAddresses = [
      { name: "Admin", addr: LEGACY_ADDRESSES.admin },
      { name: "Operator", addr: LEGACY_ADDRESSES.operator },
      { name: "Distributor", addr: LEGACY_ADDRESSES.distributor },
      { name: "Treasury Vault", addr: LEGACY_ADDRESSES.treasury },
      { name: "Claim Contract", addr: LEGACY_ADDRESSES.claimContract },
    ].filter((b) => b.addr);

    for (const b of balanceAddresses) {
      try {
        const bal = await token.balanceOf(b.addr);
        row(`${b.name} SGE`, ethers.formatUnits(bal, 18));
      } catch {
        row(`${b.name} SGE`, "(read failed)");
      }
    }
    sectionEnd();
  }

  // ── Distributor State ──────────────────────

  if (LEGACY_ADDRESSES.distributor) {
    const code = await provider.getCode(LEGACY_ADDRESSES.distributor);
    section("SgeDistributor");

    if (code === "0x") {
      row("Status", "NO CONTRACT DEPLOYED");
      sectionEnd();
    } else {
      const dist = new ethers.Contract(LEGACY_ADDRESSES.distributor, DISTRIBUTOR_ABI, provider);

      try {
        const [paused, inv, claimAmt, linkedToken, treasury] = await Promise.all([
          dist.paused(),
          dist.inventoryBalance(),
          dist.claimAmount(),
          dist.sgeToken(),
          dist.treasury(),
        ]);

        row("Paused", paused ? "🔴 YES" : "🟢 NO");
        row("Inventory", `${ethers.formatUnits(inv, 18)} SGE`);
        row("Claim Amount", `${ethers.formatUnits(claimAmt, 18)} SGE`);
        row("Linked Token", linkedToken);
        row("Treasury", treasury);

        // Roles
        const adminRole = await dist.ADMIN_ROLE();
        const opRole = await dist.OPERATOR_ROLE();

        if (LEGACY_ADDRESSES.admin) {
          const isAdmin = await dist.hasRole(adminRole, LEGACY_ADDRESSES.admin);
          row("Admin has ADMIN_ROLE", isAdmin ? "✅ YES" : "❌ NO");
        }
        if (LEGACY_ADDRESSES.operator) {
          const isOp = await dist.hasRole(opRole, LEGACY_ADDRESSES.operator);
          row("Operator has OP_ROLE", isOp ? "✅ YES" : "❌ NO");
        }
      } catch (e: any) {
        row("Error", e.message);
      }
      sectionEnd();
    }
  }

  // ── Vault State ────────────────────────────

  if (LEGACY_ADDRESSES.treasury) {
    const code = await provider.getCode(LEGACY_ADDRESSES.treasury);
    section("SgeTreasuryVault");

    if (code === "0x") {
      row("Status", "NO CONTRACT DEPLOYED");
      sectionEnd();
    } else {
      const vault = new ethers.Contract(LEGACY_ADDRESSES.treasury, VAULT_ABI, provider);

      try {
        const [paused, bal, linkedToken] = await Promise.all([
          vault.paused(),
          vault.balance(),
          vault.sgeToken(),
        ]);

        row("Paused", paused ? "🔴 YES" : "🟢 NO");
        row("Balance", `${ethers.formatUnits(bal, 18)} SGE`);
        row("Linked Token", linkedToken);

        // Distributor authorization
        if (LEGACY_ADDRESSES.distributor) {
          const distRole = await vault.DISTRIBUTOR_ROLE();
          const isAuth = await vault.hasRole(distRole, LEGACY_ADDRESSES.distributor);
          row("Distributor Auth", isAuth ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED");
        }
      } catch (e: any) {
        row("Error", e.message);
      }
      sectionEnd();
    }
  }

  // ── Access Manager State ───────────────────

  if (LEGACY_ADDRESSES.accessManager) {
    const code = await provider.getCode(LEGACY_ADDRESSES.accessManager);
    section("SgeAccessManager");

    if (code === "0x") {
      row("Status", "NO CONTRACT DEPLOYED");
      sectionEnd();
    } else {
      const am = new ethers.Contract(
        LEGACY_ADDRESSES.accessManager,
        ACCESS_MANAGER_ABI,
        provider
      );

      // Extended ABI for role checks
      const amWithRoles = new ethers.Contract(
        LEGACY_ADDRESSES.accessManager,
        [
          ...ACCESS_MANAGER_ABI,
          "function hasRole(bytes32 role, address account) view returns (bool)",
          "function ADMIN_ROLE() view returns (bytes32)",
          "function COMPLIANCE_ROLE() view returns (bytes32)",
          "function OPERATOR_ROLE() view returns (bytes32)",
        ],
        provider
      );

      try {
        const [allowlistEnabled, kycRequired, jurisdiction] = await Promise.all([
          am.allowlistEnabled(),
          am.kycRequired(),
          am.jurisdiction(),
        ]);

        row("Allowlist Enabled", allowlistEnabled ? "YES" : "NO");
        row("KYC Required", kycRequired ? "YES" : "NO");
        row("Jurisdiction", jurisdiction || "(empty)");

        // Check admin access
        if (LEGACY_ADDRESSES.admin) {
          const [permitted, reason] = await am.canAccess(LEGACY_ADDRESSES.admin);
          row("Admin canAccess", `${permitted ? "✅" : "❌"} ${reason}`);
        }

        // Role checks on AccessManager
        try {
          const adminRole = await amWithRoles.ADMIN_ROLE();
          const compRole = await amWithRoles.COMPLIANCE_ROLE();
          const opRole = await amWithRoles.OPERATOR_ROLE();

          if (LEGACY_ADDRESSES.admin) {
            const isAdmin = await amWithRoles.hasRole(adminRole, LEGACY_ADDRESSES.admin);
            row("Admin ADMIN_ROLE", isAdmin ? "✅ YES" : "❌ NO");
          }
          if (LEGACY_ADDRESSES.operator) {
            const isOp = await amWithRoles.hasRole(opRole, LEGACY_ADDRESSES.operator);
            row("Operator OP_ROLE", isOp ? "✅ YES" : "❌ NO");
            const isComp = await amWithRoles.hasRole(compRole, LEGACY_ADDRESSES.operator);
            row("Operator COMP_ROLE", isComp ? "✅ YES" : "❌ NO");
          }
        } catch {
          row("Role Checks", "(failed — contract may not support hasRole)");
        }
      } catch (e: any) {
        row("Error", e.message);
      }
      sectionEnd();
    }
  }

  // ── Admin Type Detection ───────────────────

  if (LEGACY_ADDRESSES.admin) {
    section("Admin Wallet Analysis");
    try {
      const adminCode = await provider.getCode(LEGACY_ADDRESSES.admin);
      const isContract = adminCode !== "0x" && adminCode !== "0x0";
      row("Address", LEGACY_ADDRESSES.admin);
      row("Type", isContract ? "🟢 Smart Contract (likely multisig)" : "🟡 Plain EOA");
      if (!isContract) {
        row("⚠️ WARNING", "Consider transferring admin to a multisig (see SGE-ADMIN-HARDENING.md)");
      }
    } catch (e: any) {
      row("Error", e.message);
    }
    sectionEnd();
  }

  // ── ETH Balances ───────────────────────────

  section("ETH Balances");
  const ethAddresses = [
    { name: "Admin", addr: LEGACY_ADDRESSES.admin },
    { name: "Operator", addr: LEGACY_ADDRESSES.operator },
  ].filter((b) => b.addr);

  for (const b of ethAddresses) {
    try {
      const bal = await provider.getBalance(b.addr!);
      row(`${b.name} ETH`, ethers.formatEther(bal));
    } catch {
      row(`${b.name} ETH`, "(read failed)");
    }
  }
  sectionEnd();

  console.log();
  console.log(`Inspection completed at ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
