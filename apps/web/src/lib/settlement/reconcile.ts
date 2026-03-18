// ─────────────────────────────────────────────
// Settlement Reconciliation Engine
// ─────────────────────────────────────────────
// Idempotent reconciliation:
//   poll → match → create → verify → flag
//
// Scans on-chain Claimed events, matches them against internal settlement
// records, creates missing records, verifies integrity, flags discrepancies.
//
// This runs server-side (e.g. cron / admin action).

import type {
  PaymentToken,
  SettlementRecord,
  ReconciliationResult,
} from "./types";
import { createSettlementRecord, validateSettlementIntegrity } from "./ledger";
import { SGE_CONFIG } from "@/lib/config/sge";

// ── On-chain event shape ─────────────────────

export interface ClaimedEvent {
  claimer: string;
  token: string;       // token address
  amount: string;      // raw bigint string
  txHash: string;
  blockNumber: number;
  timestamp: Date;
}

// ── Reconciliation helpers ───────────────────

/**
 * Resolve payment token symbol from its on-chain address.
 * Returns null if the address is not a known stablecoin.
 */
export function resolveTokenByAddress(
  address: string
): PaymentToken | null {
  const lower = address.toLowerCase();
  for (const [symbol, info] of Object.entries(SGE_CONFIG.tokens)) {
    if (info.address.toLowerCase() === lower) {
      return symbol as PaymentToken;
    }
  }
  return null;
}

/**
 * Core reconciliation function.
 *
 * @param onChainEvents  – array of Claimed events from the contract
 * @param existingHashes – set of claimTxHash values already in the DB
 *
 * Returns a ReconciliationResult describing what was found / created / flagged.
 */
export function reconcile(
  onChainEvents: ClaimedEvent[],
  existingHashes: Set<string>
): ReconciliationResult {
  const createdRecords: SettlementRecord[] = [];
  let matchedCount = 0;
  const errorMessages: string[] = [];
  let flaggedCount = 0;

  for (const event of onChainEvents) {
    // ── idempotency: skip if already recorded ──────────
    if (existingHashes.has(event.txHash)) {
      matchedCount++;
      continue;
    }

    // ── resolve token ──────────────────────────────────
    const token = resolveTokenByAddress(event.token);
    if (!token) {
      flaggedCount++;
      errorMessages.push(`Unknown token address: ${event.token} (tx: ${event.txHash})`);
      continue;
    }

    // ── create settlement record ───────────────────────
    try {
      const { settlement } = createSettlementRecord({
        walletAddress: event.claimer,
        paymentToken: token,
        paymentAmountRaw: event.amount,
        claimTxHash: event.txHash,
        claimBlockNumber: event.blockNumber,
        claimTimestamp: event.timestamp,
        sgeAmountExpected: SGE_CONFIG.sgeReward,
        status: "confirmed",
      });

      // ── verify integrity ──────────────────────────────
      try {
        validateSettlementIntegrity(settlement);
      } catch (err) {
        flaggedCount++;
        errorMessages.push(`Integrity check failed for tx ${event.txHash}: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }

      createdRecords.push(settlement);
    } catch (err) {
      flaggedCount++;
      errorMessages.push(`Record creation failed for tx ${event.txHash}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    processed: onChainEvents.length,
    created: createdRecords.length,
    verified: matchedCount,
    flagged: flaggedCount,
    errors: errorMessages,
  };
}

// ── ABI fragment for the Claimed event ──────────

/**
 * ⚠️ UNVERIFIED — event signature assumed from transaction receipt analysis.
 * The contract is NOT verified on Etherscan so the exact event signature,
 * parameter names, and indexing are unconfirmed. This must be validated by
 * decoding actual claim tx receipts before relying on event-based reconciliation.
 */
export const CLAIMED_EVENT_ABI = [
  "event Claimed(address indexed wallet, address token, uint256 amount, uint256 sgeAmount)",
] as const;

/**
 * Fetch Claimed events from the SGE contract between two block numbers.
 * Uses ethers v6 dynamic import to keep this module tree-shakeable
 * on the client side.
 *
 * This is a server-only function (uses RPC).
 */
export async function fetchClaimedEvents(
  rpcUrl: string,
  fromBlock: number,
  toBlock: number | "latest" = "latest"
): Promise<ClaimedEvent[]> {
  const { JsonRpcProvider, Contract } = await import("ethers");

  const provider = new JsonRpcProvider(rpcUrl);
  const contract = new Contract(
    SGE_CONFIG.claimContract,
    CLAIMED_EVENT_ABI,
    provider
  );

  const filter = contract.filters.Claimed?.();
  if (!filter) return [];

  const logs = await (contract.queryFilter as Function)(
    filter,
    fromBlock,
    toBlock
  );

  const events: ClaimedEvent[] = [];

  for (const log of logs) {
    const block = await log.getBlock();
    const parsed = contract.interface.parseLog({
      topics: log.topics as string[],
      data: log.data,
    });
    if (!parsed) continue;

    events.push({
      claimer: parsed.args[0] as string,
      token: parsed.args[1] as string,
      amount: (parsed.args[2] as bigint).toString(),
      txHash: log.transactionHash,
      blockNumber: log.blockNumber,
      timestamp: block ? new Date(block.timestamp * 1000) : new Date(),
    });
  }

  return events;
}
