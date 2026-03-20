// ─────────────────────────────────────────────
// SGE Legacy — Distributor Configuration
// ─────────────────────────────────────────────
// Shared config for all SGE legacy CLI scripts.
// Reads addresses from the canonical deployed-addresses
// registry (env → manifest → SGE_CONFIG) and provides
// typed ABIs.

import { getDeployedAddresses } from "./deployed-addresses";

// ── Addresses (canonical source of truth) ────
// Resolved fresh on import so env changes are picked up.
// Scripts that need dynamic refresh should call getDeployedAddresses() directly.

export const LEGACY_ADDRESSES = getDeployedAddresses();

// ── ABIs ─────────────────────────────────────

export const DISTRIBUTOR_ABI = [
  "function sgeToken() view returns (address)",
  "function treasury() view returns (address)",
  "function claimAmount() view returns (uint256)",
  "function inventoryBalance() view returns (uint256)",
  "function hasClaimed(address) view returns (bool)",
  "function fundInventory(uint256 amount)",
  "function distribute(address recipient, uint256 amount)",
  "function claimExact()",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function setTreasury(address newTreasury)",
  "function setClaimAmount(uint256 newAmount)",
  "function setOperator(address operator, bool granted)",
  "function rescueToken(address token, address to, uint256 amount)",
  "function drainToTreasury()",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function OPERATOR_ROLE() view returns (bytes32)",
  "event InventoryFunded(address indexed funder, uint256 amount, uint256 newBalance)",
  "event Distributed(address indexed operator, address indexed recipient, uint256 amount)",
  "event Claimed(address indexed claimer, uint256 amount)",
] as const;

export const VAULT_ABI = [
  "function sgeToken() view returns (address)",
  "function balance() view returns (uint256)",
  "function deposit(uint256 amount)",
  "function release(address to, uint256 amount)",
  "function pause()",
  "function unpause()",
  "function paused() view returns (bool)",
  "function setDistributor(address distributor, bool authorized)",
  "function emergencyWithdraw(address to)",
  "function rescueToken(address token, address to, uint256 amount)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function ADMIN_ROLE() view returns (bytes32)",
  "function DISTRIBUTOR_ROLE() view returns (bytes32)",
  "event Deposited(address indexed depositor, uint256 amount, uint256 newBalance)",
  "event Released(address indexed distributor, address indexed to, uint256 amount)",
] as const;

export const ACCESS_MANAGER_ABI = [
  "function canAccess(address account) view returns (bool permitted, string reason)",
  "function allowlistEnabled() view returns (bool)",
  "function kycRequired() view returns (bool)",
  "function jurisdiction() view returns (string)",
  "function isAllowed(address) view returns (bool)",
  "function isDenied(address) view returns (bool)",
  "function hasKyc(address) view returns (bool)",
  "function operatorOverride(address) view returns (bool)",
  "function setAllowlistEnabled(bool enabled)",
  "function setKycRequired(bool required)",
  "function setAllowed(address account, bool allowed)",
  "function setDenied(address account, bool denied)",
  "function setKycStatus(address account, bool status)",
  "function setOperatorOverride(address account, bool overridden)",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount)",
  "function transfer(address to, uint256 amount)",
] as const;

// ── Helpers ──────────────────────────────────

export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    console.error(`ERROR: Required env var ${name} is not set.`);
    process.exit(1);
  }
  return val;
}

export function getProvider() {
  const { JsonRpcProvider } = require("ethers");
  const rpc = process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com";
  return new JsonRpcProvider(rpc, 1, { staticNetwork: true });
}

export function getWallet() {
  const { Wallet } = require("ethers");
  const key = requireEnv("PRIVATE_KEY");
  const provider = getProvider();
  return new Wallet(key, provider);
}
