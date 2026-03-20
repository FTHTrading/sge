// ─────────────────────────────────────────────
// SGE Legacy Token — Type-Safe Client Helpers
// ─────────────────────────────────────────────
// Read and write helpers that account for legacy token quirks.
// All write operations verify tx receipt status instead of
// relying on function return values.

import { SGE_LEGACY_TOKEN } from "./config";
import { SGE_LEGACY_ABI } from "./abi";

// ─────────────────────────────────────────────
// Compatibility warnings — surfaced to callers
// ─────────────────────────────────────────────

export const LEGACY_WARNINGS = {
  TRANSFER_NO_BOOL:
    "Legacy SGE transfer() does not return bool. Verify success via tx receipt status, not return value.",
  NO_APPROVAL_EVENT:
    "Legacy SGE approve() does not emit Approval event. Cannot rely on event logs for allowance tracking.",
  APPROVE_RACE_CONDITION:
    "Legacy SGE has classic approve race condition. Always reset allowance to 0 before setting a new value.",
  IMMUTABLE_TOKEN:
    "The SGE token contract is immutable. No admin controls, no pause, no upgrade path.",
} as const;

// ─────────────────────────────────────────────
// Provider helpers
// ─────────────────────────────────────────────

/** Get a read-only provider. Works in both browser and Node. */
async function getReadProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const { BrowserProvider } = await import("ethers");
    return new BrowserProvider((window as any).ethereum);
  }
  // Node / CLI fallback
  const { JsonRpcProvider } = await import("ethers");
  const rpc = process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com";
  return new JsonRpcProvider(rpc, SGE_LEGACY_TOKEN.chainId, { staticNetwork: true });
}

/** Get a signer (browser only). */
async function getBrowserSigner() {
  const { BrowserProvider } = await import("ethers");
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.");
  const provider = new BrowserProvider(ethereum);
  return provider.getSigner();
}

/** Get a read-only contract instance. */
async function getReadContract() {
  const { Contract } = await import("ethers");
  const provider = await getReadProvider();
  return new Contract(SGE_LEGACY_TOKEN.address, SGE_LEGACY_ABI, provider);
}

/** Get a write-capable contract instance (browser signer). */
async function getWriteContract() {
  const { Contract } = await import("ethers");
  const signer = await getBrowserSigner();
  return new Contract(SGE_LEGACY_TOKEN.address, SGE_LEGACY_ABI, signer);
}

// ─────────────────────────────────────────────
// READ HELPERS
// ─────────────────────────────────────────────

/** Read token name */
export async function readName(): Promise<string> {
  const contract = await getReadContract();
  return (contract.name as Function)();
}

/** Read token symbol */
export async function readSymbol(): Promise<string> {
  const contract = await getReadContract();
  return (contract.symbol as Function)();
}

/** Read token decimals */
export async function readDecimals(): Promise<number> {
  const contract = await getReadContract();
  return Number(await (contract.decimals as Function)());
}

/** Read total supply (raw bigint) */
export async function readTotalSupply(): Promise<bigint> {
  const contract = await getReadContract();
  return (contract.totalSupply as Function)();
}

/** Read balance of an address (raw bigint) */
export async function readBalanceOf(account: string): Promise<bigint> {
  const contract = await getReadContract();
  return (contract.balanceOf as Function)(account);
}

/** Read allowance (raw bigint) */
export async function readAllowance(owner: string, spender: string): Promise<bigint> {
  const contract = await getReadContract();
  return (contract.allowance as Function)(owner, spender);
}

// ─────────────────────────────────────────────
// WRITE HELPERS
// ─────────────────────────────────────────────

export interface LegacyTxResult {
  txHash: string;
  success: boolean;
  blockNumber: number;
  warnings: string[];
}

/**
 * Approve spender with zero-first pattern.
 *
 * LEGACY BEHAVIOR:
 * - No Approval event emitted
 * - Race condition requires reset to 0 first
 * - We always do: approve(0) → approve(amount)
 */
export async function safeApprove(
  spender: string,
  amount: bigint
): Promise<LegacyTxResult> {
  const warnings = [LEGACY_WARNINGS.NO_APPROVAL_EVENT, LEGACY_WARNINGS.APPROVE_RACE_CONDITION];
  const contract = await getWriteContract();

  // Step 1: Reset to 0
  const currentAllowance = await readAllowance(
    await (await getBrowserSigner()).getAddress(),
    spender
  );
  if (currentAllowance > 0n) {
    const resetTx = await (contract.approve as Function)(spender, 0);
    const resetReceipt = await resetTx.wait(1);
    if (!resetReceipt || resetReceipt.status !== 1) {
      return { txHash: resetTx.hash, success: false, blockNumber: 0, warnings };
    }
  }

  // Step 2: Set new allowance
  const tx = await (contract.approve as Function)(spender, amount);
  const receipt = await tx.wait(1);
  return {
    txHash: tx.hash,
    success: receipt?.status === 1,
    blockNumber: receipt?.blockNumber ?? 0,
    warnings,
  };
}

/**
 * Safe transfer — checks receipt status, NOT return value.
 *
 * LEGACY BEHAVIOR:
 * - transfer() does NOT return bool
 * - Must verify via receipt.status
 */
export async function safeTransfer(
  to: string,
  amount: bigint
): Promise<LegacyTxResult> {
  const warnings = [LEGACY_WARNINGS.TRANSFER_NO_BOOL];
  const contract = await getWriteContract();

  const tx = await (contract.transfer as Function)(to, amount);
  const receipt = await tx.wait(1);
  return {
    txHash: tx.hash,
    success: receipt?.status === 1,
    blockNumber: receipt?.blockNumber ?? 0,
    warnings,
  };
}

/**
 * Safe transferFrom — checks receipt status, NOT return value.
 *
 * LEGACY BEHAVIOR:
 * - Same as transfer() — no bool return
 * - Requires prior approval via safeApprove
 */
export async function safeTransferFrom(
  from: string,
  to: string,
  amount: bigint
): Promise<LegacyTxResult> {
  const warnings = [LEGACY_WARNINGS.TRANSFER_NO_BOOL];
  const contract = await getWriteContract();

  const tx = await (contract.transferFrom as Function)(from, to, amount);
  const receipt = await tx.wait(1);
  return {
    txHash: tx.hash,
    success: receipt?.status === 1,
    blockNumber: receipt?.blockNumber ?? 0,
    warnings,
  };
}

/**
 * Format raw token amount to human-readable string.
 */
export function formatSGE(raw: bigint, maxDecimals = 2): string {
  const divisor = BigInt(10 ** SGE_LEGACY_TOKEN.decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(SGE_LEGACY_TOKEN.decimals, "0").slice(0, maxDecimals);
  return `${whole}.${fracStr}`;
}

/**
 * Parse human-readable SGE to raw bigint.
 */
export function parseSGE(human: string | number): bigint {
  const str = typeof human === "number" ? human.toString() : human;
  const [whole = "0", frac = ""] = str.split(".");
  const paddedFrac = frac.padEnd(SGE_LEGACY_TOKEN.decimals, "0").slice(0, SGE_LEGACY_TOKEN.decimals);
  return BigInt(whole + paddedFrac);
}
