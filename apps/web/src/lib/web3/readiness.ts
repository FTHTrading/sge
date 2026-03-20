// ─────────────────────────────────────────────
// Mainnet Claim Readiness — preflight checks
// ─────────────────────────────────────────────
// Reports a clear READY / BLOCKED verdict before attempting a live claim.
// Designed for both the UI (via browser provider) and CLI (via JsonRpcProvider).
//
// All constants come from on-chain verified truth — see docs/sge/TRUTH-PASS.md.

import { SGE_CONFIG, type SGETokenSymbol } from "@/lib/config/sge";

// ── Thresholds (with readiness margin) ──────

/** Minimum ETH for gas — recommended 0.02 ETH */
export const MIN_ETH_WEI = 20_000_000_000_000_000n; // 0.02 ETH
/** Stablecoin needed — exact 100e6, recommend 110e6 margin */
export const EXACT_STABLE_RAW = 100_000_000n; // 100 USDC/USDT
export const MARGIN_STABLE_RAW = 110_000_000n; // 110 recommended
/** Minimum SGE in contract for one claim — 1000e18 */
export const MIN_CONTRACT_SGE = 1000n * 10n ** 18n;
/** Recommended SGE in contract — 2000e18 */
export const RECOMMENDED_CONTRACT_SGE = 2000n * 10n ** 18n;

// ── Types ───────────────────────────────────

export type BlockReason =
  | "wrong_network"
  | "no_gas"
  | "insufficient_usdc"
  | "insufficient_usdt"
  | "contract_drained"
  | "already_claimed"
  | "no_wallet";

export interface ReadinessResult {
  ready: boolean;
  blocked: BlockReason[];
  warnings: string[];
  data: {
    chainId: number | null;
    wallet: string | null;
    ethBalance: bigint;
    usdcBalance: bigint;
    usdtBalance: bigint;
    contractSgeBalance: bigint;
    claimReward: bigint;
    hasClaimed: boolean;
  };
}

const EMPTY_RESULT: ReadinessResult = {
  ready: false,
  blocked: ["no_wallet"],
  warnings: [],
  data: {
    chainId: null,
    wallet: null,
    ethBalance: 0n,
    usdcBalance: 0n,
    usdtBalance: 0n,
    contractSgeBalance: 0n,
    claimReward: 0n,
    hasClaimed: false,
  },
};

// ── Browser-based readiness check ───────────

/**
 * Full preflight readiness check using the browser provider (MetaMask).
 * Returns a structured result with READY/BLOCKED verdict and reasons.
 */
export async function checkReadiness(preferredToken?: SGETokenSymbol): Promise<ReadinessResult> {
  const ethereum = typeof window !== "undefined" ? (window as any).ethereum : null;
  if (!ethereum) return { ...EMPTY_RESULT };

  const { BrowserProvider, Contract, formatUnits } = await import("ethers");
  const provider = new BrowserProvider(ethereum);

  const blocked: BlockReason[] = [];
  const warnings: string[] = [];

  // 1. Chain ID
  let chainId: number | null = null;
  try {
    const hex: string = await ethereum.request({ method: "eth_chainId" });
    chainId = parseInt(hex, 16);
    if (chainId !== SGE_CONFIG.chainId) {
      blocked.push("wrong_network");
    }
  } catch {
    blocked.push("wrong_network");
  }

  // 2. Wallet address
  let wallet: string | null = null;
  try {
    const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
    wallet = accounts[0] ?? null;
    if (!wallet) {
      return { ...EMPTY_RESULT, blocked: ["no_wallet"], data: { ...EMPTY_RESULT.data, chainId } };
    }
  } catch {
    return { ...EMPTY_RESULT, blocked: ["no_wallet"], data: { ...EMPTY_RESULT.data, chainId } };
  }

  // 3. ETH balance
  let ethBalance = 0n;
  try {
    ethBalance = await provider.getBalance(wallet);
    if (ethBalance < MIN_ETH_WEI) {
      blocked.push("no_gas");
    }
  } catch {
    blocked.push("no_gas");
  }

  // 4. USDC balance
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  let usdcBalance = 0n;
  try {
    const usdc = new Contract(SGE_CONFIG.tokens.USDC.address, erc20Abi, provider);
    usdcBalance = await (usdc.balanceOf as Function)(wallet);
    if (usdcBalance < EXACT_STABLE_RAW) {
      blocked.push("insufficient_usdc");
    } else if (usdcBalance < MARGIN_STABLE_RAW) {
      warnings.push("USDC balance is sufficient but below recommended margin (110).");
    }
  } catch {
    blocked.push("insufficient_usdc");
  }

  // 5. USDT balance
  let usdtBalance = 0n;
  try {
    const usdt = new Contract(SGE_CONFIG.tokens.USDT.address, erc20Abi, provider);
    usdtBalance = await (usdt.balanceOf as Function)(wallet);
    if (usdtBalance < EXACT_STABLE_RAW) {
      blocked.push("insufficient_usdt");
    } else if (usdtBalance < MARGIN_STABLE_RAW) {
      warnings.push("USDT balance is sufficient but below recommended margin (110).");
    }
  } catch {
    blocked.push("insufficient_usdt");
  }

  // 6. Contract SGE balance
  let contractSgeBalance = 0n;
  try {
    const sge = new Contract(SGE_CONFIG.sgeToken, erc20Abi, provider);
    contractSgeBalance = await (sge.balanceOf as Function)(SGE_CONFIG.claimContract);
    if (contractSgeBalance < MIN_CONTRACT_SGE) {
      blocked.push("contract_drained");
    } else if (contractSgeBalance < RECOMMENDED_CONTRACT_SGE) {
      warnings.push("Contract SGE is below recommended 2,000 SGE margin.");
    }
  } catch {
    blocked.push("contract_drained");
  }

  // 7. Claim reward from CLAIM_AMOUNT()
  let claimReward = 0n;
  const claimAbi = [
    "function CLAIM_AMOUNT() view returns (uint256)",
    "function hasClaimed(address) view returns (bool)",
  ];
  try {
    const claim = new Contract(SGE_CONFIG.claimContract, claimAbi, provider);
    claimReward = await (claim.CLAIM_AMOUNT as Function)();
  } catch {
    warnings.push("Could not read CLAIM_AMOUNT() from contract.");
  }

  // 8. hasClaimed
  let hasClaimed = false;
  try {
    const claim = new Contract(SGE_CONFIG.claimContract, claimAbi, provider);
    hasClaimed = await (claim.hasClaimed as Function)(wallet);
    if (hasClaimed) {
      blocked.push("already_claimed");
    }
  } catch {
    warnings.push("Could not check hasClaimed status.");
  }

  // Determine final readiness:
  // READY = at least one stablecoin is sufficient, plus gas, correct chain, not claimed, contract funded
  const criticalBlocks = blocked.filter(
    (b) => b !== "insufficient_usdc" && b !== "insufficient_usdt"
  );
  const hasUsdc = !blocked.includes("insufficient_usdc");
  const hasUsdt = !blocked.includes("insufficient_usdt");
  const hasAnyStable = hasUsdc || hasUsdt;

  // If user specified a preferred token, check only that
  let ready: boolean;
  if (preferredToken) {
    const hasPreferred = preferredToken === "USDC" ? hasUsdc : hasUsdt;
    ready = criticalBlocks.length === 0 && hasPreferred;
  } else {
    ready = criticalBlocks.length === 0 && hasAnyStable;
  }

  return {
    ready,
    blocked,
    warnings,
    data: {
      chainId,
      wallet,
      ethBalance,
      usdcBalance,
      usdtBalance,
      contractSgeBalance,
      claimReward,
      hasClaimed,
    },
  };
}

/**
 * Human-readable label for a block reason.
 */
export function blockReasonLabel(reason: BlockReason): string {
  switch (reason) {
    case "wrong_network": return "BLOCKED: Wrong network — switch to Ethereum Mainnet";
    case "no_gas": return "BLOCKED: Insufficient ETH for gas (need ≥ 0.02 ETH)";
    case "insufficient_usdc": return "BLOCKED: Insufficient USDC (need ≥ 100)";
    case "insufficient_usdt": return "BLOCKED: Insufficient USDT (need ≥ 100)";
    case "contract_drained": return "BLOCKED: Contract drained — no SGE to claim";
    case "already_claimed": return "BLOCKED: Wallet has already claimed";
    case "no_wallet": return "BLOCKED: No wallet connected";
  }
}
