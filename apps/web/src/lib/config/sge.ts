// ─────────────────────────────────────────────
// SGE Configuration — Contracts, Tokens, Settlement
// ─────────────────────────────────────────────

export const SGE_CONFIG = {
  /** SGE Claim contract on Ethereum Mainnet */
  claimContract: "0x4BFeF695a5f85a65E1Aa6015439f317494477D09" as const,

  /** SGE Token (discovered via sgeToken() on-chain call) */
  sgeToken: "0x40489719E489782959486A04B765E1e93e5B221a" as const,

  /** Contract owner / deployer */
  contractOwner: "0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7" as const,

  /** Ethereum Mainnet chain ID */
  chainId: 1,
  chainName: "Ethereum Mainnet",

  /** Block explorer */
  explorerBaseUrl: "https://etherscan.io",

  /** Supported stablecoins */
  tokens: {
    USDC: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
      symbol: "USDC" as const,
      name: "USD Coin",
      decimals: 6,
      logo: "/tokens/usdc.svg",
    },
    USDT: {
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const,
      symbol: "USDT" as const,
      name: "Tether USD",
      decimals: 6,
      logo: "/tokens/usdt.svg",
    },
  },

  /** Claim amounts */
  claimAmountRaw: "100000000", // 100 * 10^6
  claimAmountHuman: 100,
  sgeReward: 1000,

  /** Default approval amount (same as claim for tight approval) */
  defaultApprovalAmount: "100000000",

  /** Settlement allocation percentages — must sum to 100 */
  allocation: {
    treasury: 70,
    reserve: 15,
    fee: 10,
    community: 5,
  },

  /** Reconciliation */
  reconciliation: {
    intervalMs: 60_000,
    confirmations: 1,
    txTimeoutMs: 120_000,
    pollIntervalMs: 3_000,
  },
} as const;

export type SGETokenSymbol = keyof typeof SGE_CONFIG.tokens;
export type AllocationLegType = keyof typeof SGE_CONFIG.allocation;

/** Helper: build explorer link */
export function explorerUrl(path: string): string {
  return `${SGE_CONFIG.explorerBaseUrl}${path}`;
}

export function explorerTxUrl(txHash: string): string {
  return explorerUrl(`/tx/${txHash}`);
}

export function explorerAddressUrl(address: string): string {
  return explorerUrl(`/address/${address}`);
}
