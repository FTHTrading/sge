// ─────────────────────────────────────────────
// SGE Legacy — Event Reader & Monitoring
// ─────────────────────────────────────────────
// On-chain event indexing for the SGE contract set.
// Reads historical events and provides monitoring
// hooks for admin UI and CLI diagnostics.
//
// All functions are read-only and work with any
// ethers v6 Provider (browser or Node).

// ── Event ABIs ───────────────────────────────

export const DISTRIBUTOR_EVENT_ABI = [
  "event InventoryFunded(address indexed funder, uint256 amount, uint256 newBalance)",
  "event Distributed(address indexed operator, address indexed recipient, uint256 amount)",
  "event Claimed(address indexed claimer, uint256 amount)",
  "event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury)",
  "event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount)",
  "event TokenRescued(address indexed token, address indexed to, uint256 amount)",
  "event OperatorUpdated(address indexed operator, bool granted)",
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const;

export const VAULT_EVENT_ABI = [
  "event Deposited(address indexed depositor, uint256 amount, uint256 newBalance)",
  "event Released(address indexed distributor, address indexed to, uint256 amount)",
  "event EmergencyWithdraw(address indexed admin, address indexed to, uint256 amount)",
  "event DistributorUpdated(address indexed distributor, bool authorized)",
  "event TokenRescued(address indexed token, address indexed to, uint256 amount)",
  "event Paused(address account)",
  "event Unpaused(address account)",
] as const;

export const ACCESS_MANAGER_EVENT_ABI = [
  "event AllowlistToggled(bool enabled)",
  "event KycToggled(bool required)",
  "event JurisdictionUpdated(string oldJurisdiction, string newJurisdiction)",
  "event AllowedUpdated(address indexed account, bool allowed)",
  "event DeniedUpdated(address indexed account, bool denied)",
  "event KycStatusUpdated(address indexed account, bool status)",
  "event OperatorOverrideUpdated(address indexed account, bool overridden)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
] as const;

// ── Types ────────────────────────────────────

export interface EventEntry {
  /** Event name (e.g. "Claimed", "InventoryFunded") */
  name: string;
  /** Source contract */
  source: "distributor" | "vault" | "accessManager";
  /** Block number */
  block: number;
  /** Transaction hash */
  txHash: string;
  /** Decoded event args */
  args: Record<string, any>;
  /** ISO timestamp (if block timestamp available) */
  timestamp?: string;
}

export interface InventoryAlert {
  type: "low_inventory" | "zero_inventory" | "healthy";
  balance: bigint;
  threshold: bigint;
  claimAmount: bigint;
  remainingClaims: number;
  message: string;
}

// ── Constants ────────────────────────────────

/** Default lookback window: ~7 days of blocks (1 block ≈ 12s) */
export const DEFAULT_LOOKBACK_BLOCKS = 50_400;

/** Low inventory threshold: fewer than this many claims worth of SGE */
export const LOW_INVENTORY_THRESHOLD_CLAIMS = 50;

// ── Event Readers ────────────────────────────

/**
 * Query recent Claimed events from the distributor.
 */
export async function getRecentClaims(
  provider: any,
  distributorAddress: string,
  lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS
): Promise<EventEntry[]> {
  const { ethers } = await import("ethers");
  const dist = new ethers.Contract(distributorAddress, DISTRIBUTOR_EVENT_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - lookbackBlocks);

  const events = await dist.queryFilter(dist.filters.Claimed(), fromBlock, currentBlock);

  return events.map((e: any) => ({
    name: "Claimed",
    source: "distributor" as const,
    block: e.blockNumber,
    txHash: e.transactionHash,
    args: {
      claimer: e.args?.claimer ?? e.args?.[0],
      amount: e.args?.amount ?? e.args?.[1],
    },
  }));
}

/**
 * Query recent Distributed events from the distributor.
 */
export async function getRecentDistributions(
  provider: any,
  distributorAddress: string,
  lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS
): Promise<EventEntry[]> {
  const { ethers } = await import("ethers");
  const dist = new ethers.Contract(distributorAddress, DISTRIBUTOR_EVENT_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - lookbackBlocks);

  const events = await dist.queryFilter(dist.filters.Distributed(), fromBlock, currentBlock);

  return events.map((e: any) => ({
    name: "Distributed",
    source: "distributor" as const,
    block: e.blockNumber,
    txHash: e.transactionHash,
    args: {
      operator: e.args?.operator ?? e.args?.[0],
      recipient: e.args?.recipient ?? e.args?.[1],
      amount: e.args?.amount ?? e.args?.[2],
    },
  }));
}

/**
 * Query all funding events from the distributor.
 */
export async function getInventoryFundEvents(
  provider: any,
  distributorAddress: string,
  lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS
): Promise<EventEntry[]> {
  const { ethers } = await import("ethers");
  const dist = new ethers.Contract(distributorAddress, DISTRIBUTOR_EVENT_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - lookbackBlocks);

  const events = await dist.queryFilter(dist.filters.InventoryFunded(), fromBlock, currentBlock);

  return events.map((e: any) => ({
    name: "InventoryFunded",
    source: "distributor" as const,
    block: e.blockNumber,
    txHash: e.transactionHash,
    args: {
      funder: e.args?.funder ?? e.args?.[0],
      amount: e.args?.amount ?? e.args?.[1],
      newBalance: e.args?.newBalance ?? e.args?.[2],
    },
  }));
}

/**
 * Query all role-change events from any contract.
 * Useful for auditing when roles were granted/revoked.
 */
export async function getRoleChangeEvents(
  provider: any,
  contractAddress: string,
  lookbackBlocks = DEFAULT_LOOKBACK_BLOCKS
): Promise<EventEntry[]> {
  const { ethers } = await import("ethers");

  const abi = [
    "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
    "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)",
  ];

  const contract = new ethers.Contract(contractAddress, abi, provider);
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - lookbackBlocks);

  const [grants, revokes] = await Promise.all([
    contract.queryFilter(contract.filters.RoleGranted(), fromBlock, currentBlock),
    contract.queryFilter(contract.filters.RoleRevoked(), fromBlock, currentBlock),
  ]);

  const entries: EventEntry[] = [
    ...grants.map((e: any) => ({
      name: "RoleGranted",
      source: "unknown" as const,
      block: e.blockNumber,
      txHash: e.transactionHash,
      args: { role: e.args?.[0], account: e.args?.[1], sender: e.args?.[2] },
    })),
    ...revokes.map((e: any) => ({
      name: "RoleRevoked",
      source: "unknown" as const,
      block: e.blockNumber,
      txHash: e.transactionHash,
      args: { role: e.args?.[0], account: e.args?.[1], sender: e.args?.[2] },
    })),
  ];

  return entries.sort((a, b) => a.block - b.block);
}

// ── Inventory Monitoring ─────────────────────

/**
 * Check current distributor inventory against claim amount
 * and return an alert level.
 */
export async function checkInventoryHealth(
  provider: any,
  distributorAddress: string,
  thresholdClaims = LOW_INVENTORY_THRESHOLD_CLAIMS
): Promise<InventoryAlert> {
  const { ethers } = await import("ethers");

  const dist = new ethers.Contract(
    distributorAddress,
    [
      "function inventoryBalance() view returns (uint256)",
      "function claimAmount() view returns (uint256)",
    ],
    provider
  );

  const [inventory, claimAmount] = await Promise.all([
    dist.inventoryBalance(),
    dist.claimAmount(),
  ]);

  const inventoryBig = BigInt(inventory);
  const claimBig = BigInt(claimAmount);
  const threshold = claimBig * BigInt(thresholdClaims);
  const remainingClaims = claimBig > 0n ? Number(inventoryBig / claimBig) : 0;

  if (inventoryBig === 0n) {
    return {
      type: "zero_inventory",
      balance: inventoryBig,
      threshold,
      claimAmount: claimBig,
      remainingClaims: 0,
      message: `Distributor inventory is EMPTY — no claims can be processed`,
    };
  }

  if (inventoryBig < threshold) {
    return {
      type: "low_inventory",
      balance: inventoryBig,
      threshold,
      claimAmount: claimBig,
      remainingClaims,
      message: `Low inventory: ${remainingClaims} claims remaining (threshold: ${thresholdClaims})`,
    };
  }

  return {
    type: "healthy",
    balance: inventoryBig,
    threshold,
    claimAmount: claimBig,
    remainingClaims,
    message: `Healthy: ${remainingClaims} claims remaining`,
  };
}

/**
 * Check if an address is a smart contract (code.length > 0)
 * vs a plain EOA. Used for admin hardening checks.
 */
export async function isSmartContract(
  provider: any,
  address: string
): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== "0x" && code !== "0x0";
}
