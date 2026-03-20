#!/usr/bin/env npx ts-node --esm
// @ts-nocheck — CLI script; ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// preflight-sge-legacy.ts
// ─────────────────────────────────────────────
// Read-only verification of the entire SGE legacy
// infrastructure. Checks RPC, chain, token, distributor,
// vault, access manager — everything needed before
// moving real funds.
//
// Usage:
//   MAINNET_RPC_URL=... npx ts-node scripts/preflight-sge-legacy.ts
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

// ── Types ────────────────────────────────────

interface CheckResult {
  label: string;
  status: "PASS" | "FAIL" | "WARN" | "SKIP";
  detail: string;
}

const results: CheckResult[] = [];

function pass(label: string, detail: string) {
  results.push({ label, status: "PASS", detail });
}
function fail(label: string, detail: string) {
  results.push({ label, status: "FAIL", detail });
}
function warn(label: string, detail: string) {
  results.push({ label, status: "WARN", detail });
}
function skip(label: string, detail: string) {
  results.push({ label, status: "SKIP", detail });
}

// ── Checks ───────────────────────────────────

async function checkRpcConnection(provider: ethers.JsonRpcProvider) {
  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) === 1) {
      pass("RPC Connection", `Connected to Ethereum Mainnet (chainId ${network.chainId})`);
    } else {
      fail("RPC Connection", `Wrong chain: expected 1, got ${network.chainId}`);
    }
  } catch (e: any) {
    fail("RPC Connection", `Cannot connect: ${e.message}`);
  }
}

async function checkBlockHeight(provider: ethers.JsonRpcProvider) {
  try {
    const block = await provider.getBlockNumber();
    if (block > 0) {
      pass("Block Height", `Current block: ${block.toLocaleString()}`);
    } else {
      fail("Block Height", `Block number is ${block}`);
    }
  } catch (e: any) {
    fail("Block Height", e.message);
  }
}

async function checkTokenReachable(provider: ethers.JsonRpcProvider) {
  const addr = LEGACY_ADDRESSES.sgeToken;
  if (!addr) {
    fail("SGE Token", "Address not configured");
    return;
  }

  try {
    const token = new ethers.Contract(addr, ERC20_ABI, provider);
    const [symbol, decimals] = await Promise.all([
      token.symbol(),
      token.decimals(),
    ]);
    if (symbol === "SGE" && Number(decimals) === 18) {
      pass("SGE Token", `${symbol} (${decimals} decimals) at ${addr}`);
    } else {
      warn("SGE Token", `Unexpected: symbol=${symbol}, decimals=${decimals}`);
    }
  } catch (e: any) {
    fail("SGE Token", `Cannot read token at ${addr}: ${e.message}`);
  }
}

async function checkTokenBalance(provider: ethers.JsonRpcProvider) {
  const addr = LEGACY_ADDRESSES.sgeToken;
  if (!addr) { skip("Token Supply Check", "No token address"); return; }

  try {
    const token = new ethers.Contract(addr, ERC20_ABI, provider);
    // Check a few known addresses
    const checks: Array<{ name: string; address: string }> = [];

    if (LEGACY_ADDRESSES.distributor) {
      checks.push({ name: "Distributor", address: LEGACY_ADDRESSES.distributor });
    }
    if (LEGACY_ADDRESSES.treasury) {
      checks.push({ name: "Treasury Vault", address: LEGACY_ADDRESSES.treasury });
    }
    if (LEGACY_ADDRESSES.claimContract) {
      checks.push({ name: "Claim Contract", address: LEGACY_ADDRESSES.claimContract });
    }
    if (LEGACY_ADDRESSES.admin) {
      checks.push({ name: "Admin Wallet", address: LEGACY_ADDRESSES.admin });
    }

    for (const c of checks) {
      try {
        const bal = await token.balanceOf(c.address);
        const formatted = ethers.formatUnits(bal, 18);
        const status = BigInt(bal) > 0n ? "PASS" : "WARN";
        results.push({
          label: `${c.name} Balance`,
          status,
          detail: `${formatted} SGE at ${c.address}`,
        });
      } catch (e: any) {
        warn(`${c.name} Balance`, `Cannot read: ${e.message}`);
      }
    }
  } catch (e: any) {
    fail("Token Balances", e.message);
  }
}

async function checkDistributor(provider: ethers.JsonRpcProvider) {
  const addr = LEGACY_ADDRESSES.distributor;
  if (!addr) { skip("Distributor", "SGE_DISTRIBUTOR_ADDRESS not set"); return; }

  try {
    const code = await provider.getCode(addr);
    if (code === "0x") {
      fail("Distributor Deployed", `No contract at ${addr}`);
      return;
    }
    pass("Distributor Deployed", `Contract found at ${addr}`);

    const dist = new ethers.Contract(addr, DISTRIBUTOR_ABI, provider);

    // Check linked token
    const linkedToken = await dist.sgeToken();
    if (linkedToken.toLowerCase() === LEGACY_ADDRESSES.sgeToken.toLowerCase()) {
      pass("Distributor → Token", `Linked to ${linkedToken}`);
    } else {
      fail("Distributor → Token", `Expected ${LEGACY_ADDRESSES.sgeToken}, got ${linkedToken}`);
    }

    // Check paused
    const paused = await dist.paused();
    if (paused) {
      warn("Distributor Paused", "Contract is PAUSED — claims disabled");
    } else {
      pass("Distributor Paused", "Not paused — operational");
    }

    // Inventory
    const inv = await dist.inventoryBalance();
    const formatted = ethers.formatUnits(inv, 18);
    results.push({
      label: "Distributor Inventory",
      status: BigInt(inv) > 0n ? "PASS" : "WARN",
      detail: `${formatted} SGE available`,
    });

    // Claim amount
    const claimAmt = await dist.claimAmount();
    pass("Claim Amount", `${ethers.formatUnits(claimAmt, 18)} SGE per claim`);

    // Treasury
    const treas = await dist.treasury();
    pass("Distributor Treasury", treas);

    // Admin role
    if (LEGACY_ADDRESSES.admin) {
      const adminRole = await dist.ADMIN_ROLE();
      const isAdmin = await dist.hasRole(adminRole, LEGACY_ADDRESSES.admin);
      results.push({
        label: "Admin Role",
        status: isAdmin ? "PASS" : "FAIL",
        detail: `${LEGACY_ADDRESSES.admin} ${isAdmin ? "HAS" : "MISSING"} ADMIN_ROLE`,
      });
    }

    // Operator role
    if (LEGACY_ADDRESSES.operator) {
      const opRole = await dist.OPERATOR_ROLE();
      const isOp = await dist.hasRole(opRole, LEGACY_ADDRESSES.operator);
      results.push({
        label: "Operator Role",
        status: isOp ? "PASS" : "WARN",
        detail: `${LEGACY_ADDRESSES.operator} ${isOp ? "HAS" : "MISSING"} OPERATOR_ROLE`,
      });
    }
  } catch (e: any) {
    fail("Distributor", e.message);
  }
}

async function checkVault(provider: ethers.JsonRpcProvider) {
  const addr = LEGACY_ADDRESSES.treasury;
  if (!addr) { skip("Treasury Vault", "SGE_TREASURY_ADDRESS not set"); return; }

  try {
    const code = await provider.getCode(addr);
    if (code === "0x") {
      fail("Vault Deployed", `No contract at ${addr}`);
      return;
    }
    pass("Vault Deployed", `Contract found at ${addr}`);

    const vault = new ethers.Contract(addr, VAULT_ABI, provider);

    const paused = await vault.paused();
    results.push({
      label: "Vault Paused",
      status: paused ? "WARN" : "PASS",
      detail: paused ? "PAUSED" : "Operational",
    });

    const bal = await vault.balance();
    results.push({
      label: "Vault Balance",
      status: BigInt(bal) > 0n ? "PASS" : "WARN",
      detail: `${ethers.formatUnits(bal, 18)} SGE`,
    });

    // Check distributor authorization
    if (LEGACY_ADDRESSES.distributor) {
      const distRole = await vault.DISTRIBUTOR_ROLE();
      const isAuth = await vault.hasRole(distRole, LEGACY_ADDRESSES.distributor);
      results.push({
        label: "Vault → Distributor Auth",
        status: isAuth ? "PASS" : "WARN",
        detail: `Distributor ${isAuth ? "authorized" : "NOT authorized"}`,
      });
    }
  } catch (e: any) {
    fail("Treasury Vault", e.message);
  }
}

async function checkAccessManager(provider: ethers.JsonRpcProvider) {
  const addr = LEGACY_ADDRESSES.accessManager;
  if (!addr) { skip("Access Manager", "SGE_ACCESS_MANAGER_ADDRESS not set"); return; }

  try {
    const code = await provider.getCode(addr);
    if (code === "0x") {
      fail("Access Manager Deployed", `No contract at ${addr}`);
      return;
    }
    pass("Access Manager Deployed", `Contract found at ${addr}`);

    const am = new ethers.Contract(addr, ACCESS_MANAGER_ABI, provider);

    const allowlistEnabled = await am.allowlistEnabled();
    const kycRequired = await am.kycRequired();
    const jurisdiction = await am.jurisdiction();

    pass("Access Config", `allowlist=${allowlistEnabled}, kyc=${kycRequired}, jurisdiction="${jurisdiction}"`);

    // Check access for admin
    if (LEGACY_ADDRESSES.admin) {
      const [permitted, reason] = await am.canAccess(LEGACY_ADDRESSES.admin);
      results.push({
        label: "Admin Access",
        status: permitted ? "PASS" : "WARN",
        detail: `${permitted ? "PERMITTED" : "DENIED"}: ${reason}`,
      });
    }
  } catch (e: any) {
    fail("Access Manager", e.message);
  }
}

// ── Main ─────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   SGE Legacy — Preflight System Check       ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log();

  const provider = getProvider();

  await checkRpcConnection(provider);
  await checkBlockHeight(provider);
  await checkTokenReachable(provider);
  await checkTokenBalance(provider);
  await checkDistributor(provider);
  await checkVault(provider);
  await checkAccessManager(provider);

  // ── Print Results ────────────────────────────

  console.log();
  console.log("┌──────────────────────────────────────────────┐");
  console.log("│                  RESULTS                     │");
  console.log("├──────────────────────────────────────────────┤");

  const statusIcon = { PASS: "✅", FAIL: "❌", WARN: "⚠️ ", SKIP: "⏭️ " };

  for (const r of results) {
    console.log(`│ ${statusIcon[r.status]} ${r.label.padEnd(24)} ${r.detail}`);
  }

  console.log("└──────────────────────────────────────────────┘");
  console.log();

  const fails = results.filter((r) => r.status === "FAIL").length;
  const warns = results.filter((r) => r.status === "WARN").length;
  const passes = results.filter((r) => r.status === "PASS").length;
  const skips = results.filter((r) => r.status === "SKIP").length;

  console.log(`PASS: ${passes}  |  WARN: ${warns}  |  FAIL: ${fails}  |  SKIP: ${skips}`);
  console.log();

  if (fails > 0) {
    console.log("❌  PREFLIGHT FAILED — resolve all FAIL items before proceeding.");
    process.exit(1);
  } else if (warns > 0) {
    console.log("⚠️  PREFLIGHT PASSED WITH WARNINGS — review before proceeding.");
    process.exit(0);
  } else {
    console.log("✅  PREFLIGHT PASSED — system is ready.");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
