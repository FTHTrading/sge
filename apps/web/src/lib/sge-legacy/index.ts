// ─────────────────────────────────────────────
// SGE Legacy Token — Package Index
// ─────────────────────────────────────────────

export { SGE_LEGACY_TOKEN, legacyTokenExplorerUrl, legacyExplorerAddressUrl } from "./config";
export type { SgeLegacyConfig } from "./config";

export { SGE_LEGACY_ABI, SGE_LEGACY_READ_ABI, SGE_LEGACY_WRITE_ABI } from "./abi";

export {
  LEGACY_WARNINGS,
  // Read
  readName,
  readSymbol,
  readDecimals,
  readTotalSupply,
  readBalanceOf,
  readAllowance,
  // Write
  safeApprove,
  safeTransfer,
  safeTransferFrom,
  // Format
  formatSGE,
  parseSGE,
} from "./client";
export type { LegacyTxResult } from "./client";

export {
  LEGACY_ADDRESSES,
  DISTRIBUTOR_ABI,
  VAULT_ABI,
  ACCESS_MANAGER_ABI,
  ERC20_ABI,
  requireEnv,
  getProvider,
  getWallet,
} from "./script-config";

export { checkLegacyReadiness, readinessVerdict } from "./readiness";
export type { ReadinessCheck, LegacyReadinessResult, LegacyReadinessConfig, CheckStatus } from "./readiness";

// ── Deployed Address Registry ────────────────
export {
  getDeployedAddresses,
  validateAddresses,
  isValidAddress,
  loadManifest,
  clearManifestCache,
} from "./deployed-addresses";
export type { DeployedAddresses, DeploymentManifest, AddressValidation } from "./deployed-addresses";

// ── Role Map & Access Control ────────────────
export {
  ROLE_HASHES,
  EXPECTED_ROLE_ASSIGNMENTS,
  HAS_ROLE_ABI,
  checkAllRoles,
  summarizeRoles,
} from "./role-map";
export type { RoleAssignment, RoleCheckResult } from "./role-map";

// ── Event Reader & Monitoring ────────────────
export {
  DISTRIBUTOR_EVENT_ABI,
  VAULT_EVENT_ABI,
  ACCESS_MANAGER_EVENT_ABI,
  DEFAULT_LOOKBACK_BLOCKS,
  LOW_INVENTORY_THRESHOLD_CLAIMS,
  getRecentClaims,
  getRecentDistributions,
  getInventoryFundEvents,
  getRoleChangeEvents,
  checkInventoryHealth,
  isSmartContract,
} from "./event-reader";
export type { EventEntry, InventoryAlert } from "./event-reader";
