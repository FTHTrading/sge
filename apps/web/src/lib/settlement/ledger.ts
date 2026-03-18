// ─────────────────────────────────────────────
// Settlement Ledger
// ─────────────────────────────────────────────
// Append-only ledger for recording settlement allocations.
// In production, this backs into the database (Prisma/TransactionLog).
// This module provides the computation and in-memory model.

import { randomUUID } from "crypto";
import type {
  LedgerEntry,
  AllocationLeg,
  PaymentToken,
  SettlementRecord,
  SettlementStatus,
} from "./types";
import { computeClaimAllocations } from "./allocator";
import { SGE_CONFIG } from "@/lib/config/sge";

/**
 * Create a full settlement record with allocation legs and ledger entries.
 *
 * This is designed to be called AFTER on-chain confirmation, inside a
 * single database transaction for internal atomicity.
 */
export function createSettlementRecord(params: {
  walletAddress: string;
  paymentToken: PaymentToken;
  paymentAmountRaw: string;
  claimTxHash: string;
  claimBlockNumber: number;
  claimTimestamp: Date;
  sgeAmountExpected: number;
  sgeAmountDelivered?: number | null;
  status?: SettlementStatus;
}): { settlement: SettlementRecord; ledgerEntries: LedgerEntry[] } {
  const id = randomUUID();
  const decimals = SGE_CONFIG.tokens[params.paymentToken]?.decimals ?? 6;
  const paymentHuman =
    Number(BigInt(params.paymentAmountRaw)) / Math.pow(10, decimals);

  const allocations = computeClaimAllocations(
    params.paymentAmountRaw,
    params.paymentToken
  );

  const settlement: SettlementRecord = {
    id,
    walletAddress: params.walletAddress,
    paymentToken: params.paymentToken,
    paymentAmountRaw: params.paymentAmountRaw,
    paymentAmountHuman: paymentHuman,
    claimTxHash: params.claimTxHash,
    claimBlockNumber: params.claimBlockNumber,
    claimTimestamp: params.claimTimestamp,
    claimStatus: params.status ?? "confirmed",
    sgeAmountExpected: params.sgeAmountExpected,
    sgeAmountDelivered: params.sgeAmountDelivered ?? null,
    allocations,
    reconciledAt: null,
    createdAt: new Date(),
  };

  const ledgerEntries: LedgerEntry[] = allocations.map((leg) => ({
    id: randomUUID(),
    settlementId: id,
    legType: leg.type,
    direction: "credit" as const,
    token: params.paymentToken,
    amountRaw: leg.amountRaw,
    amountHuman: leg.amountHuman,
    memo: `${params.paymentToken} claim settlement — ${leg.destinationLabel} (${leg.percentage}%)`,
    createdAt: new Date(),
  }));

  return { settlement, ledgerEntries };
}

/**
 * Validate that a settlement record's allocations sum to the payment amount.
 * Returns true if valid, throws on mismatch.
 */
export function validateSettlementIntegrity(record: SettlementRecord): boolean {
  const paymentRaw = BigInt(record.paymentAmountRaw);
  const allocSum = record.allocations.reduce(
    (sum, leg) => sum + BigInt(leg.amountRaw),
    0n
  );

  if (allocSum !== paymentRaw) {
    throw new Error(
      `Settlement ${record.id} allocation mismatch: ` +
        `payment=${paymentRaw.toString()}, allocations=${allocSum.toString()}`
    );
  }

  return true;
}
