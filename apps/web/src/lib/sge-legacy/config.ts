// ─────────────────────────────────────────────
// SGE Legacy Token — Canonical Configuration
// ─────────────────────────────────────────────
// Source-of-truth for the deployed legacy SGE ERC-20 token.
// This token is immutable, already on mainnet, and NOT fully
// ERC-20 compliant. All adapter logic wraps around this config.

import { SGE_CONFIG } from "@/lib/config/sge";

export const SGE_LEGACY_TOKEN = {
  /** Token symbol */
  symbol: "SGE" as const,

  /** Token name */
  name: "Scalable Green Energy" as const,

  /** ERC-20 decimals */
  decimals: 18,

  /** Deployed mainnet address — immutable */
  address: SGE_CONFIG.sgeToken, // 0x40489719E489782959486A04B765E1e93e5B221a

  /** Ethereum Mainnet */
  chainId: SGE_CONFIG.chainId, // 1

  /** Block explorer base URL */
  explorerBaseUrl: SGE_CONFIG.explorerBaseUrl,

  /** Known legacy compatibility flags */
  legacy: {
    /** transfer() does NOT return bool — must use safeTransfer pattern */
    transferReturnsBool: false,

    /** No Approval event emitted on approve() — cannot rely on event logs */
    emitsApprovalEvent: false,

    /** Classic approve() race condition — use zero-first pattern */
    approveRaceCondition: true,

    /** Old Solidity / old constructor style */
    modernSolidity: false,

    /** No admin/owner controls on the token itself */
    hasAdmin: false,

    /** No pause mechanism */
    hasPause: false,

    /** No rescue / recovery function */
    hasRescue: false,

    /** No role-based access system */
    hasRoles: false,

    /** No compliance hooks */
    hasComplianceHooks: false,

    /** Not upgradeable */
    isUpgradeable: false,
  },
} as const;

export type SgeLegacyConfig = typeof SGE_LEGACY_TOKEN;

/** Build Etherscan token URL */
export function legacyTokenExplorerUrl(): string {
  return `${SGE_LEGACY_TOKEN.explorerBaseUrl}/token/${SGE_LEGACY_TOKEN.address}`;
}

/** Build Etherscan address URL for any address */
export function legacyExplorerAddressUrl(address: string): string {
  return `${SGE_LEGACY_TOKEN.explorerBaseUrl}/address/${address}`;
}
