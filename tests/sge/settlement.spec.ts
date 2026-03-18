/**
 * Settlement Engine — Unit Tests
 *
 * Tests allocation math (bigint precision), ledger creation,
 * integrity validation, and reconciliation idempotency.
 */

import { describe, it, expect } from "vitest";
import {
  validateAllocation,
  computeAllocations,
  computeClaimAllocations,
} from "../../apps/web/src/lib/settlement/allocator";
import {
  createSettlementRecord,
  validateSettlementIntegrity,
} from "../../apps/web/src/lib/settlement/ledger";
import {
  reconcile,
  resolveTokenByAddress,
} from "../../apps/web/src/lib/settlement/reconcile";
import type { ClaimedEvent } from "../../apps/web/src/lib/settlement/reconcile";
import { DEFAULT_ALLOCATION } from "../../apps/web/src/lib/settlement/types";

// ── Allocator Tests ──────────────────────────────

describe("allocator — validateAllocation", () => {
  it("should accept the default allocation (sums to 100)", () => {
    expect(() => validateAllocation(DEFAULT_ALLOCATION)).not.toThrow();
  });

  it("should reject allocations that sum to less than 100", () => {
    expect(() =>
      validateAllocation({ treasuryPercent: 50, reservePercent: 10, feePercent: 10, communityPercent: 5 })
    ).toThrow("must sum to 100");
  });

  it("should reject allocations that sum to more than 100", () => {
    expect(() =>
      validateAllocation({ treasuryPercent: 80, reservePercent: 15, feePercent: 10, communityPercent: 5 })
    ).toThrow("must sum to 100");
  });
});

describe("allocator — computeAllocations", () => {
  it("should produce legs that sum exactly to the total amount", () => {
    const totalRaw = "100000000"; // 100 USDC (6 decimals)
    const legs = computeAllocations(totalRaw, "USDC", 6, DEFAULT_ALLOCATION);

    const sum = legs.reduce((acc, leg) => acc + BigInt(leg.amountRaw), 0n);
    expect(sum).toBe(BigInt(totalRaw));
  });

  it("should assign correct percentages", () => {
    const legs = computeAllocations("100000000", "USDC", 6, DEFAULT_ALLOCATION);

    const treasury = legs.find((l) => l.type === "treasury");
    const reserve = legs.find((l) => l.type === "reserve");
    const fee = legs.find((l) => l.type === "fee");
    const community = legs.find((l) => l.type === "community");

    // 70% of 100_000_000 = 70_000_000
    expect(BigInt(treasury!.amountRaw)).toBe(70_000_000n);
    // 15% = 15_000_000
    expect(BigInt(reserve!.amountRaw)).toBe(15_000_000n);
    // 10% = 10_000_000
    expect(BigInt(fee!.amountRaw)).toBe(10_000_000n);
    // 5% = 5_000_000
    expect(BigInt(community!.amountRaw)).toBe(5_000_000n);
  });

  it("should assign remainder to treasury when division is uneven", () => {
    // 3 raw units — 70% = 2.1 → floor(2), remainder goes to treasury
    const legs = computeAllocations("3", "USDC", 6, DEFAULT_ALLOCATION);
    const sum = legs.reduce((acc, leg) => acc + BigInt(leg.amountRaw), 0n);
    expect(sum).toBe(3n);

    const treasury = legs.find((l) => l.type === "treasury");
    // Treasury gets floor(70% * 3) + remainder
    expect(BigInt(treasury!.amountRaw)).toBeGreaterThanOrEqual(2n);
  });

  it("should handle 1 raw unit (indivisible)", () => {
    const legs = computeAllocations("1", "USDC", 6, DEFAULT_ALLOCATION);
    const sum = legs.reduce((acc, leg) => acc + BigInt(leg.amountRaw), 0n);
    expect(sum).toBe(1n);
  });
});

describe("allocator — computeClaimAllocations", () => {
  it("should use SGE_CONFIG defaults for USDC", () => {
    const legs = computeClaimAllocations("100000000", "USDC");
    expect(legs.length).toBe(4);
    const sum = legs.reduce((acc, leg) => acc + BigInt(leg.amountRaw), 0n);
    expect(sum).toBe(100_000_000n);
  });

  it("should use SGE_CONFIG defaults for USDT", () => {
    const legs = computeClaimAllocations("100000000", "USDT");
    expect(legs.length).toBe(4);
    const sum = legs.reduce((acc, leg) => acc + BigInt(leg.amountRaw), 0n);
    expect(sum).toBe(100_000_000n);
  });
});

// ── Ledger Tests ─────────────────────────────────

describe("ledger — createSettlementRecord", () => {
  const params = {
    walletAddress: "0xAbC1230000000000000000000000000000000001",
    paymentToken: "USDC" as const,
    paymentAmountRaw: "100000000",
    claimTxHash: "0xtx_abc123",
    claimBlockNumber: 19_000_000,
    claimTimestamp: new Date("2024-06-01T12:00:00Z"),
    sgeAmountExpected: 1000,
  };

  it("should create a settlement record with 4 allocation legs", () => {
    const { settlement, ledgerEntries } = createSettlementRecord(params);
    expect(settlement.allocations.length).toBe(4);
    expect(ledgerEntries.length).toBe(4);
  });

  it("should set the correct wallet and tx hash", () => {
    const { settlement } = createSettlementRecord(params);
    expect(settlement.walletAddress).toBe(params.walletAddress);
    expect(settlement.claimTxHash).toBe(params.claimTxHash);
  });

  it("should have a human-readable payment amount", () => {
    const { settlement } = createSettlementRecord(params);
    expect(settlement.paymentAmountHuman).toBe(100);
  });

  it("should default to 'confirmed' status", () => {
    const { settlement } = createSettlementRecord(params);
    expect(settlement.claimStatus).toBe("confirmed");
  });
});

describe("ledger — validateSettlementIntegrity", () => {
  it("should pass for a correctly allocated settlement", () => {
    const { settlement } = createSettlementRecord({
      walletAddress: "0x0001",
      paymentToken: "USDC",
      paymentAmountRaw: "100000000",
      claimTxHash: "0x1234",
      claimBlockNumber: 1,
      claimTimestamp: new Date(),
      sgeAmountExpected: 1000,
    });
    expect(validateSettlementIntegrity(settlement)).toBe(true);
  });

  it("should throw on tampered allocations", () => {
    const { settlement } = createSettlementRecord({
      walletAddress: "0x0001",
      paymentToken: "USDC",
      paymentAmountRaw: "100000000",
      claimTxHash: "0x5678",
      claimBlockNumber: 1,
      claimTimestamp: new Date(),
      sgeAmountExpected: 1000,
    });
    // Tamper: reduce first leg amount
    settlement.allocations[0]!.amountRaw = "0";
    expect(() => validateSettlementIntegrity(settlement)).toThrow("allocation mismatch");
  });
});

// ── Reconciliation Tests ─────────────────────────

describe("reconcile — resolveTokenByAddress", () => {
  it("should resolve USDC address", () => {
    expect(
      resolveTokenByAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
    ).toBe("USDC");
  });

  it("should resolve USDT address (case-insensitive)", () => {
    expect(
      resolveTokenByAddress("0xdac17f958d2ee523a2206206994597c13d831ec7")
    ).toBe("USDT");
  });

  it("should return null for unknown address", () => {
    expect(
      resolveTokenByAddress("0x0000000000000000000000000000000000000000")
    ).toBe(null);
  });
});

describe("reconcile — reconcile()", () => {
  const baseEvent: ClaimedEvent = {
    claimer: "0xAbC1230000000000000000000000000000000001",
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    amount: "100000000",
    txHash: "0xtx_new_001",
    blockNumber: 19_000_000,
    timestamp: new Date("2024-06-01T12:00:00Z"),
  };

  it("should create a record for a new event", () => {
    const result = reconcile([baseEvent], new Set());
    expect(result.created).toBe(1);
    expect(result.verified).toBe(0);
    expect(result.flagged).toBe(0);
  });

  it("should skip already-recorded events (idempotent)", () => {
    const existing = new Set(["0xtx_new_001"]);
    const result = reconcile([baseEvent], existing);
    expect(result.created).toBe(0);
    expect(result.verified).toBe(1);
  });

  it("should flag events with unknown token addresses", () => {
    const badEvent: ClaimedEvent = {
      ...baseEvent,
      txHash: "0xtx_bad_token",
      token: "0x0000000000000000000000000000000000000000",
    };
    const result = reconcile([badEvent], new Set());
    expect(result.flagged).toBe(1);
    expect(result.errors[0]).toContain("Unknown token");
  });

  it("should handle mixed events correctly", () => {
    const events: ClaimedEvent[] = [
      { ...baseEvent, txHash: "0xtx_existing" },
      { ...baseEvent, txHash: "0xtx_new_002" },
      { ...baseEvent, txHash: "0xtx_bad", token: "0xBAD" },
    ];
    const existing = new Set(["0xtx_existing"]);
    const result = reconcile(events, existing);
    expect(result.processed).toBe(3);
    expect(result.verified).toBe(1);
    expect(result.created).toBe(1);
    expect(result.flagged).toBe(1);
  });
});
