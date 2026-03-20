// @ts-nocheck — ethers v6 Contract methods are dynamically typed
// ─────────────────────────────────────────────
// SGE Legacy — Readiness / Monitoring
// ─────────────────────────────────────────────
// Comprehensive readiness checks for the new
// Distributor/Vault/AccessManager infrastructure.
//
// Can be used from:
//   - Browser (BrowserProvider via MetaMask)
//   - CLI (JsonRpcProvider via MAINNET_RPC_URL)
//   - Admin UI pages (read-only status)
//
// Returns a structured result with PASS/FAIL/WARN
// for each subsystem.
//
// v2: Now includes role wiring checks, admin type
//     detection, operator address validation, and
//     inventory health alerting.

import { SGE_CONFIG } from "@/lib/config/sge";
import { SGE_LEGACY_TOKEN } from "./config";
import {
  ERC20_ABI as TOKEN_ABI,
  DISTRIBUTOR_ABI as DIST_ABI,
  VAULT_ABI,
  ACCESS_MANAGER_ABI as AM_ABI,
} from "./script-config";
import { getDeployedAddresses, validateAddresses, isValidAddress } from "./deployed-addresses";
import { ROLE_HASHES } from "./role-map";

// ── Types ────────────────────────────────────

export type CheckStatus = "pass" | "fail" | "warn" | "skip";

export interface ReadinessCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  subsystem: "rpc" | "token" | "distributor" | "vault" | "access" | "role" | "inventory" | "address" | "admin";
}

export interface LegacyReadinessResult {
  ready: boolean;
  timestamp: string;
  checks: ReadinessCheck[];
  summary: {
    pass: number;
    fail: number;
    warn: number;
    skip: number;
    total: number;
  };
}

// ── Configuration ────────────────────────────

export interface LegacyReadinessConfig {
  rpcUrl?: string;
  sgeTokenAddress?: string;
  distributorAddress?: string;
  treasuryAddress?: string;
  accessManagerAddress?: string;
  adminAddress?: string;
  operatorAddress?: string;
  /** Inventory threshold in claim-count (default: 50) */
  lowInventoryThreshold?: number;
  /** Skip address validation checks */
  skipAddressValidation?: boolean;
}

// ── ABIs imported from ./script-config (single source of truth) ──

// ── Main Check Function ──────────────────────

export async function checkLegacyReadiness(
  config: LegacyReadinessConfig = {}
): Promise<LegacyReadinessResult> {
  // Dynamic import to avoid bundling ethers in server components
  const { ethers } = await import("ethers");

  const checks: ReadinessCheck[] = [];

  // Resolve addresses from canonical registry, with config overrides
  const deployed = getDeployedAddresses();

  const tokenAddr = config.sgeTokenAddress ?? deployed.sgeToken;
  const distAddr = config.distributorAddress ?? deployed.distributor;
  const vaultAddr = config.treasuryAddress ?? deployed.treasury;
  const amAddr = config.accessManagerAddress ?? deployed.accessManager;
  const adminAddr = config.adminAddress ?? deployed.admin;
  const operatorAddr = config.operatorAddress ?? deployed.operator;

  // ── 0. Address Validation ──────────────────

  if (!config.skipAddressValidation) {
    const addrChecks = [
      { id: "addr_token", label: "SGE Token Address", addr: tokenAddr, required: true },
      { id: "addr_dist", label: "Distributor Address", addr: distAddr, required: true },
      { id: "addr_vault", label: "Vault Address", addr: vaultAddr, required: true },
      { id: "addr_am", label: "AccessManager Address", addr: amAddr, required: true },
      { id: "addr_admin", label: "Admin Address", addr: adminAddr, required: true },
      { id: "addr_operator", label: "Operator Address", addr: operatorAddr, required: false },
    ];

    for (const { id, label, addr, required } of addrChecks) {
      if (!addr) {
        checks.push({
          id,
          label,
          status: required ? "warn" : "skip",
          detail: required ? "Not configured — required for operation" : "Not configured",
          subsystem: "address",
        });
      } else if (!isValidAddress(addr)) {
        checks.push({
          id,
          label,
          status: "fail",
          detail: `Invalid address format: ${addr}`,
          subsystem: "address",
        });
      } else {
        checks.push({
          id,
          label,
          status: "pass",
          detail: addr,
          subsystem: "address",
        });
      }
    }
  }

  // ── 1. RPC Connection ──────────────────────

  let provider: InstanceType<typeof ethers.JsonRpcProvider>;
  try {
    const rpc = config.rpcUrl ?? "https://eth.llamarpc.com";
    provider = new ethers.JsonRpcProvider(rpc, 1, { staticNetwork: true });
    const network = await provider.getNetwork();
    if (Number(network.chainId) === 1) {
      checks.push({ id: "rpc_chain", label: "RPC Chain ID", status: "pass", detail: `Chain ID ${network.chainId}`, subsystem: "rpc" });
    } else {
      checks.push({ id: "rpc_chain", label: "RPC Chain ID", status: "fail", detail: `Expected 1, got ${network.chainId}`, subsystem: "rpc" });
    }
  } catch (e: any) {
    checks.push({ id: "rpc_chain", label: "RPC Connection", status: "fail", detail: e.message, subsystem: "rpc" });
    return buildResult(checks);
  }

  try {
    const block = await provider.getBlockNumber();
    checks.push({ id: "rpc_block", label: "Block Height", status: block > 0 ? "pass" : "fail", detail: `Block ${block.toLocaleString()}`, subsystem: "rpc" });
  } catch (e: any) {
    checks.push({ id: "rpc_block", label: "Block Height", status: "fail", detail: e.message, subsystem: "rpc" });
  }

  // ── 2. Token Reachable ─────────────────────

  try {
    const token = new ethers.Contract(tokenAddr, TOKEN_ABI, provider);
    const [symbol, decimals] = await Promise.all([token.symbol(), token.decimals()]);
    const ok = symbol === "SGE" && Number(decimals) === 18;
    checks.push({
      id: "token_reachable",
      label: "SGE Token Reachable",
      status: ok ? "pass" : "warn",
      detail: `${symbol} (${decimals} decimals) at ${tokenAddr}`,
      subsystem: "token",
    });
  } catch (e: any) {
    checks.push({ id: "token_reachable", label: "SGE Token Reachable", status: "fail", detail: e.message, subsystem: "token" });
  }

  // ── 3. Distributor ─────────────────────────

  if (!distAddr) {
    checks.push({ id: "dist_deployed", label: "Distributor Deployed", status: "skip", detail: "Address not configured", subsystem: "distributor" });
  } else {
    try {
      const code = await provider.getCode(distAddr);
      if (code === "0x") {
        checks.push({ id: "dist_deployed", label: "Distributor Deployed", status: "fail", detail: `No contract at ${distAddr}`, subsystem: "distributor" });
      } else {
        checks.push({ id: "dist_deployed", label: "Distributor Deployed", status: "pass", detail: distAddr, subsystem: "distributor" });

        const dist = new ethers.Contract(distAddr, DIST_ABI, provider);

        // Token link
        const linkedToken = await dist.sgeToken();
        checks.push({
          id: "dist_token_link",
          label: "Distributor → Token",
          status: linkedToken.toLowerCase() === tokenAddr.toLowerCase() ? "pass" : "fail",
          detail: linkedToken,
          subsystem: "distributor",
        });

        // Paused
        const paused = await dist.paused();
        checks.push({
          id: "dist_paused",
          label: "Distributor Paused",
          status: paused ? "warn" : "pass",
          detail: paused ? "PAUSED" : "Operational",
          subsystem: "distributor",
        });

        // Inventory with health alerting
        const inv = await dist.inventoryBalance();
        const invBig = BigInt(inv);
        const claimAmt = await dist.claimAmount();
        const claimBig = BigInt(claimAmt);
        const threshold = config.lowInventoryThreshold ?? 50;
        const remainingClaims = claimBig > 0n ? Number(invBig / claimBig) : 0;

        let invStatus: CheckStatus = "pass";
        let invDetail = `${ethers.formatUnits(inv, 18)} SGE (${remainingClaims} claims remaining)`;
        if (invBig === 0n) {
          invStatus = "fail";
          invDetail = "EMPTY — no claims can be processed";
        } else if (remainingClaims < threshold) {
          invStatus = "warn";
          invDetail = `LOW: ${ethers.formatUnits(inv, 18)} SGE (${remainingClaims} claims — threshold: ${threshold})`;
        }

        checks.push({
          id: "dist_inventory",
          label: "Distributor Inventory",
          status: invStatus,
          detail: invDetail,
          subsystem: "inventory",
        });

        // Claim amount
        checks.push({
          id: "dist_claim_amount",
          label: "Claim Amount",
          status: "pass",
          detail: `${ethers.formatUnits(claimAmt, 18)} SGE per claim`,
          subsystem: "distributor",
        });

        // Admin role on distributor
        if (adminAddr) {
          const isAdmin = await dist.hasRole(ROLE_HASHES.ADMIN, adminAddr);
          checks.push({
            id: "dist_admin_role",
            label: "Admin has ADMIN_ROLE",
            status: isAdmin ? "pass" : "fail",
            detail: `${adminAddr} → ${isAdmin ? "YES" : "NO"}`,
            subsystem: "role",
          });
        }

        // Operator role on distributor
        if (operatorAddr) {
          const isOp = await dist.hasRole(ROLE_HASHES.OPERATOR, operatorAddr);
          checks.push({
            id: "dist_operator_role",
            label: "Operator has OPERATOR_ROLE",
            status: isOp ? "pass" : "warn",
            detail: `${operatorAddr} → ${isOp ? "YES" : "NO"}`,
            subsystem: "role",
          });
        } else {
          checks.push({
            id: "dist_operator_role",
            label: "Operator Address",
            status: "warn",
            detail: "No operator address configured — distribute() requires OPERATOR_ROLE",
            subsystem: "role",
          });
        }
      }
    } catch (e: any) {
      checks.push({ id: "dist_error", label: "Distributor Check", status: "fail", detail: e.message, subsystem: "distributor" });
    }
  }

  // ── 4. Vault ───────────────────────────────

  if (!vaultAddr) {
    checks.push({ id: "vault_deployed", label: "Vault Deployed", status: "skip", detail: "Address not configured", subsystem: "vault" });
  } else {
    try {
      const code = await provider.getCode(vaultAddr);
      if (code === "0x") {
        checks.push({ id: "vault_deployed", label: "Vault Deployed", status: "fail", detail: `No contract at ${vaultAddr}`, subsystem: "vault" });
      } else {
        checks.push({ id: "vault_deployed", label: "Vault Deployed", status: "pass", detail: vaultAddr, subsystem: "vault" });

        const vault = new ethers.Contract(vaultAddr, VAULT_ABI, provider);

        const paused = await vault.paused();
        checks.push({
          id: "vault_paused",
          label: "Vault Paused",
          status: paused ? "warn" : "pass",
          detail: paused ? "PAUSED" : "Operational",
          subsystem: "vault",
        });

        const bal = await vault.balance();
        checks.push({
          id: "vault_balance",
          label: "Vault Balance",
          status: BigInt(bal) > 0n ? "pass" : "warn",
          detail: `${ethers.formatUnits(bal, 18)} SGE`,
          subsystem: "inventory",
        });

        // Distributor authorized on vault (DISTRIBUTOR_ROLE)
        if (distAddr) {
          const isAuth = await vault.hasRole(ROLE_HASHES.DISTRIBUTOR, distAddr);
          checks.push({
            id: "vault_dist_auth",
            label: "Vault → Distributor Auth",
            status: isAuth ? "pass" : "fail",
            detail: isAuth ? "AUTHORIZED" : "NOT AUTHORIZED — distributor cannot release vault funds",
            subsystem: "role",
          });
        }

        // Admin role on vault
        if (adminAddr) {
          const isAdmin = await vault.hasRole(ROLE_HASHES.ADMIN, adminAddr);
          checks.push({
            id: "vault_admin_role",
            label: "Vault Admin ADMIN_ROLE",
            status: isAdmin ? "pass" : "fail",
            detail: `${adminAddr} → ${isAdmin ? "YES" : "NO"}`,
            subsystem: "role",
          });
        }
      }
    } catch (e: any) {
      checks.push({ id: "vault_error", label: "Vault Check", status: "fail", detail: e.message, subsystem: "vault" });
    }
  }

  // ── 5. Access Manager ──────────────────────

  if (!amAddr) {
    checks.push({ id: "am_deployed", label: "Access Manager Deployed", status: "skip", detail: "Address not configured", subsystem: "access" });
  } else {
    try {
      const code = await provider.getCode(amAddr);
      if (code === "0x") {
        checks.push({ id: "am_deployed", label: "Access Manager Deployed", status: "fail", detail: `No contract at ${amAddr}`, subsystem: "access" });
      } else {
        checks.push({ id: "am_deployed", label: "Access Manager Deployed", status: "pass", detail: amAddr, subsystem: "access" });

        const am = new ethers.Contract(amAddr, AM_ABI, provider);
        const [allowlist, kyc, jurisdiction] = await Promise.all([
          am.allowlistEnabled(),
          am.kycRequired(),
          am.jurisdiction(),
        ]);

        checks.push({
          id: "am_config",
          label: "Access Config",
          status: "pass",
          detail: `allowlist=${allowlist}, kyc=${kyc}, jurisdiction="${jurisdiction}"`,
          subsystem: "access",
        });

        if (adminAddr) {
          const [permitted, reason] = await am.canAccess(adminAddr);
          checks.push({
            id: "am_admin_access",
            label: "Admin canAccess",
            status: permitted ? "pass" : "warn",
            detail: `${permitted ? "PERMITTED" : "DENIED"}: ${reason}`,
            subsystem: "access",
          });

          // Admin has ADMIN_ROLE on AccessManager
          const hasAdminRole = await am.hasRole(ROLE_HASHES.ADMIN, adminAddr);
          checks.push({
            id: "am_admin_role",
            label: "AM Admin ADMIN_ROLE",
            status: hasAdminRole ? "pass" : "fail",
            detail: `${adminAddr} → ${hasAdminRole ? "YES" : "NO"}`,
            subsystem: "role",
          });
        }

        // Operator has OPERATOR_ROLE on AM
        if (operatorAddr) {
          const hasOpRole = await am.hasRole(ROLE_HASHES.OPERATOR, operatorAddr);
          checks.push({
            id: "am_operator_role",
            label: "AM Operator OPERATOR_ROLE",
            status: hasOpRole ? "pass" : "warn",
            detail: `${operatorAddr} → ${hasOpRole ? "YES" : "NO"}`,
            subsystem: "role",
          });
        }
      }
    } catch (e: any) {
      checks.push({ id: "am_error", label: "Access Manager Check", status: "fail", detail: e.message, subsystem: "access" });
    }
  }

  // ── 6. Admin Type (EOA vs Contract) ────────

  if (adminAddr && isValidAddress(adminAddr)) {
    try {
      const adminCode = await provider.getCode(adminAddr);
      const isMultisig = adminCode !== "0x" && adminCode !== "0x0";
      checks.push({
        id: "admin_type",
        label: "Admin Wallet Type",
        status: isMultisig ? "pass" : "warn",
        detail: isMultisig
          ? "Smart contract (multisig) — recommended"
          : "Plain EOA — consider transferring admin to a multisig for production",
        subsystem: "admin",
      });
    } catch {
      checks.push({
        id: "admin_type",
        label: "Admin Wallet Type",
        status: "skip",
        detail: "Could not determine admin wallet type",
        subsystem: "admin",
      });
    }
  }

  return buildResult(checks);
}

// ── Build Result ─────────────────────────────

function buildResult(checks: ReadinessCheck[]): LegacyReadinessResult {
  const summary = {
    pass: checks.filter((c) => c.status === "pass").length,
    fail: checks.filter((c) => c.status === "fail").length,
    warn: checks.filter((c) => c.status === "warn").length,
    skip: checks.filter((c) => c.status === "skip").length,
    total: checks.length,
  };

  return {
    ready: summary.fail === 0,
    timestamp: new Date().toISOString(),
    checks,
    summary,
  };
}

// ── Quick Status (for UI badges) ─────────────

export function readinessVerdict(result: LegacyReadinessResult): {
  label: string;
  color: "emerald" | "amber" | "red";
} {
  if (result.summary.fail > 0) {
    return { label: "BLOCKED", color: "red" };
  }
  if (result.summary.warn > 0) {
    return { label: "READY (with warnings)", color: "amber" };
  }
  return { label: "READY", color: "emerald" };
}
