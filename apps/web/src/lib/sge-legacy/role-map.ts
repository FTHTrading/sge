// ─────────────────────────────────────────────
// SGE Legacy — Role Map & Access Control Wiring
// ─────────────────────────────────────────────
// Defines every role across all 3 contracts, the
// expected assignments, and provides on-chain
// role verification utilities.
//
// Contracts:
//   SgeDistributor   → ADMIN_ROLE, OPERATOR_ROLE
//   SgeTreasuryVault → ADMIN_ROLE, DISTRIBUTOR_ROLE
//   SgeAccessManager → ADMIN_ROLE, COMPLIANCE_ROLE, OPERATOR_ROLE

import {
  DISTRIBUTOR_ABI,
  VAULT_ABI,
  ACCESS_MANAGER_ABI,
} from "./script-config";

// ── Role Identifiers ─────────────────────────
// keccak256 hashes matching the Solidity declarations

export const ROLE_HASHES = {
  // OpenZeppelin DEFAULT_ADMIN_ROLE = 0x00
  DEFAULT_ADMIN:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  // keccak256("ADMIN_ROLE")
  ADMIN:
    "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775",
  // keccak256("OPERATOR_ROLE")
  OPERATOR:
    "0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929",
  // keccak256("COMPLIANCE_ROLE")
  COMPLIANCE:
    "0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55",
  // keccak256("DISTRIBUTOR_ROLE")
  DISTRIBUTOR:
    "0x85faced7bde13e1a7dad704b895f006e704f207617d68166b31ba2d79624862d",
} as const;

// ── Role ↔ Contract Matrix ───────────────────

export interface RoleAssignment {
  /** Which contract holds this role */
  contract: "distributor" | "vault" | "accessManager";
  /** Human-readable role name */
  roleName: string;
  /** keccak256 role hash */
  roleHash: string;
  /** Which address should hold this role */
  expectedHolder: "admin" | "operator" | "compliance" | "distributor";
  /** How critical is this assignment */
  severity: "critical" | "recommended" | "optional";
  /** Description */
  description: string;
}

/**
 * Complete list of role assignments required for a
 * properly-wired SGE deployment.
 */
export const EXPECTED_ROLE_ASSIGNMENTS: RoleAssignment[] = [
  // ── SgeDistributor roles ─────────────────
  {
    contract: "distributor",
    roleName: "DEFAULT_ADMIN_ROLE",
    roleHash: ROLE_HASHES.DEFAULT_ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can grant/revoke all roles on Distributor",
  },
  {
    contract: "distributor",
    roleName: "ADMIN_ROLE",
    roleHash: ROLE_HASHES.ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can pause/unpause, set treasury, set claim amount, drain",
  },
  {
    contract: "distributor",
    roleName: "OPERATOR_ROLE",
    roleHash: ROLE_HASHES.OPERATOR,
    expectedHolder: "operator",
    severity: "recommended",
    description: "Can call distribute() to send tokens to recipients",
  },

  // ── SgeTreasuryVault roles ───────────────
  {
    contract: "vault",
    roleName: "DEFAULT_ADMIN_ROLE",
    roleHash: ROLE_HASHES.DEFAULT_ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can grant/revoke all roles on Vault",
  },
  {
    contract: "vault",
    roleName: "ADMIN_ROLE",
    roleHash: ROLE_HASHES.ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can pause/unpause, emergency withdraw, rescue tokens",
  },
  {
    contract: "vault",
    roleName: "DISTRIBUTOR_ROLE",
    roleHash: ROLE_HASHES.DISTRIBUTOR,
    expectedHolder: "distributor",
    severity: "critical",
    description: "Distributor contract authorized to release Vault funds",
  },

  // ── SgeAccessManager roles ───────────────
  {
    contract: "accessManager",
    roleName: "DEFAULT_ADMIN_ROLE",
    roleHash: ROLE_HASHES.DEFAULT_ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can grant/revoke all roles on AccessManager",
  },
  {
    contract: "accessManager",
    roleName: "ADMIN_ROLE",
    roleHash: ROLE_HASHES.ADMIN,
    expectedHolder: "admin",
    severity: "critical",
    description: "Can toggle allowlist, KYC, jurisdiction settings",
  },
  {
    contract: "accessManager",
    roleName: "COMPLIANCE_ROLE",
    roleHash: ROLE_HASHES.COMPLIANCE,
    expectedHolder: "compliance",
    severity: "recommended",
    description: "Can set allowed/denied/KYC status for individual addresses",
  },
  {
    contract: "accessManager",
    roleName: "OPERATOR_ROLE",
    roleHash: ROLE_HASHES.OPERATOR,
    expectedHolder: "operator",
    severity: "optional",
    description: "Can set operator overrides (bypass all access checks)",
  },
];

// ── On-Chain Role Checking ───────────────────

export interface RoleCheckResult {
  contract: string;
  roleName: string;
  holder: string;
  expected: boolean;
  actual: boolean;
  severity: "critical" | "recommended" | "optional";
  description: string;
}

/**
 * ABI fragment for hasRole — works on all 3 contracts.
 */
export const HAS_ROLE_ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
] as const;

/**
 * Check all expected role assignments against live contracts.
 *
 * @param provider - ethers Provider
 * @param addresses - deployed addresses (from getDeployedAddresses)
 * @returns Array of role check results
 */
export async function checkAllRoles(
  provider: any,
  addresses: {
    distributor: string;
    treasury: string;
    accessManager: string;
    admin: string;
    operator: string;
  }
): Promise<RoleCheckResult[]> {
  const { ethers } = await import("ethers");
  const results: RoleCheckResult[] = [];

  const contractAddrs: Record<string, string> = {
    distributor: addresses.distributor,
    vault: addresses.treasury,
    accessManager: addresses.accessManager,
  };

  const holderAddrs: Record<string, string> = {
    admin: addresses.admin,
    operator: addresses.operator,
    compliance: addresses.operator, // Compliance often starts as operator; adjust if separate
    distributor: addresses.distributor,
  };

  for (const assignment of EXPECTED_ROLE_ASSIGNMENTS) {
    const contractAddr = contractAddrs[assignment.contract];
    const holderAddr = holderAddrs[assignment.expectedHolder];

    if (!contractAddr || !holderAddr) {
      results.push({
        contract: assignment.contract,
        roleName: assignment.roleName,
        holder: holderAddr || "(not configured)",
        expected: true,
        actual: false,
        severity: assignment.severity,
        description: `${assignment.description} — address not configured`,
      });
      continue;
    }

    try {
      const contract = new ethers.Contract(contractAddr, HAS_ROLE_ABI, provider);
      const hasRole = await contract.hasRole(assignment.roleHash, holderAddr);

      results.push({
        contract: assignment.contract,
        roleName: assignment.roleName,
        holder: holderAddr,
        expected: true,
        actual: hasRole,
        severity: assignment.severity,
        description: assignment.description,
      });
    } catch (e: any) {
      results.push({
        contract: assignment.contract,
        roleName: assignment.roleName,
        holder: holderAddr,
        expected: true,
        actual: false,
        severity: assignment.severity,
        description: `${assignment.description} — check failed: ${e.message}`,
      });
    }
  }

  return results;
}

/**
 * Summarize role check results for readiness reporting.
 */
export function summarizeRoles(results: RoleCheckResult[]): {
  allCriticalOk: boolean;
  criticalMissing: RoleCheckResult[];
  recommendedMissing: RoleCheckResult[];
  total: number;
  granted: number;
  missing: number;
} {
  const missing = results.filter((r) => !r.actual);
  const criticalMissing = missing.filter((r) => r.severity === "critical");
  const recommendedMissing = missing.filter((r) => r.severity === "recommended");

  return {
    allCriticalOk: criticalMissing.length === 0,
    criticalMissing,
    recommendedMissing,
    total: results.length,
    granted: results.filter((r) => r.actual).length,
    missing: missing.length,
  };
}
