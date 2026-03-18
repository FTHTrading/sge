// ─────────────────────────────────────────────
// Settlement Allocator
// ─────────────────────────────────────────────
// Breaks a claim payment into deterministic allocation legs.
// All math is done in raw token units (bigint) for precision.

import {
  type AllocationLeg,
  type LegType,
  type PaymentToken,
  type SettlementConfig,
  DEFAULT_ALLOCATION,
  LEG_LABELS,
} from "./types";

/**
 * Validate that allocation percentages sum to exactly 100.
 * Throws if invalid.
 */
export function validateAllocation(config: SettlementConfig): void {
  const sum =
    config.treasuryPercent +
    config.reservePercent +
    config.feePercent +
    config.communityPercent;

  if (sum !== 100) {
    throw new Error(
      `Allocation percentages must sum to 100, got ${sum}. ` +
        `treasury=${config.treasuryPercent}, reserve=${config.reservePercent}, ` +
        `fee=${config.feePercent}, community=${config.communityPercent}`
    );
  }

  const values = [
    config.treasuryPercent,
    config.reservePercent,
    config.feePercent,
    config.communityPercent,
  ];
  for (const v of values) {
    if (v < 0 || v > 100 || !Number.isInteger(v)) {
      throw new Error(`Each allocation must be an integer between 0-100, got ${v}`);
    }
  }
}

/**
 * Compute allocation legs from a raw payment amount.
 *
 * Uses integer math:
 *   leg_amount = (raw * percentage) / 100
 *
 * Any remainder from integer division goes to the treasury leg to avoid dust.
 */
export function computeAllocations(
  paymentAmountRaw: string,
  token: PaymentToken,
  decimals: number,
  config: SettlementConfig = DEFAULT_ALLOCATION
): AllocationLeg[] {
  validateAllocation(config);

  const raw = BigInt(paymentAmountRaw);
  const divisor = BigInt(10 ** decimals);

  const legSpecs: { type: LegType; pct: number }[] = [
    { type: "reserve", pct: config.reservePercent },
    { type: "fee", pct: config.feePercent },
    { type: "community", pct: config.communityPercent },
    // treasury is last — gets remainder
    { type: "treasury", pct: config.treasuryPercent },
  ];

  const legs: AllocationLeg[] = [];
  let allocated = 0n;

  for (let i = 0; i < legSpecs.length; i++) {
    const spec = legSpecs[i]!;
    let legRaw: bigint;

    if (i === legSpecs.length - 1) {
      // Treasury gets remainder to avoid dust
      legRaw = raw - allocated;
    } else {
      legRaw = (raw * BigInt(spec.pct)) / 100n;
      allocated += legRaw;
    }

    const humanAmount = Number(legRaw) / Number(divisor);

    legs.push({
      type: spec.type,
      percentage: spec.pct,
      amountRaw: legRaw.toString(),
      amountHuman: Math.round(humanAmount * 100) / 100,
      destinationLabel: LEG_LABELS[spec.type],
    });
  }

  return legs;
}

/**
 * Compute allocations for a standard SGE claim (100 USDC/USDT, 6 decimals).
 */
export function computeClaimAllocations(
  paymentAmountRaw: string,
  token: PaymentToken,
  config?: SettlementConfig
): AllocationLeg[] {
  return computeAllocations(paymentAmountRaw, token, 6, config);
}
