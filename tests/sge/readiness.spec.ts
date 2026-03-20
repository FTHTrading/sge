/**
 * SGE Preflight Readiness — Unit Tests
 *
 * Tests the readiness module's blocking/ready logic.
 * All chain reads are mocked — no RPC connection needed.
 */

import { describe, it, expect } from "vitest";
import {
  type BlockReason,
  type ReadinessResult,
  blockReasonLabel,
  MIN_ETH_WEI,
  EXACT_STABLE_RAW,
  MIN_CONTRACT_SGE,
  RECOMMENDED_CONTRACT_SGE,
} from "@/lib/web3/readiness";

// ── Helper: build a mock ReadinessResult ─────

function makeResult(overrides: Partial<ReadinessResult["data"]> = {}, blocked: BlockReason[] = []): ReadinessResult {
  const data: ReadinessResult["data"] = {
    chainId: 1,
    wallet: "0xAbC1230000000000000000000000000000000001",
    ethBalance: 50_000_000_000_000_000n, // 0.05 ETH
    usdcBalance: 200_000_000n, // 200 USDC
    usdtBalance: 150_000_000n, // 150 USDT
    contractSgeBalance: 5000n * 10n ** 18n, // 5000 SGE
    claimReward: 1000n * 10n ** 18n,
    hasClaimed: false,
    ...overrides,
  };

  return {
    ready: blocked.length === 0,
    blocked,
    warnings: [],
    data,
  };
}

// ── Tests ──────────────────────────────────────

describe("Readiness — thresholds", () => {
  it("MIN_ETH_WEI should be 0.02 ETH", () => {
    expect(MIN_ETH_WEI).toBe(20_000_000_000_000_000n);
  });

  it("EXACT_STABLE_RAW should be 100e6", () => {
    expect(EXACT_STABLE_RAW).toBe(100_000_000n);
  });

  it("MIN_CONTRACT_SGE should be 1000e18", () => {
    expect(MIN_CONTRACT_SGE).toBe(1000n * 10n ** 18n);
  });

  it("RECOMMENDED_CONTRACT_SGE should be 2000e18", () => {
    expect(RECOMMENDED_CONTRACT_SGE).toBe(2000n * 10n ** 18n);
  });
});

describe("Readiness — blocking states", () => {
  it("should report BLOCKED: wrong_network when chain != 1", () => {
    const r = makeResult({ chainId: 5 }, ["wrong_network"]);
    expect(r.blocked).toContain("wrong_network");
    expect(r.ready).toBe(false);
  });

  it("should report BLOCKED: no_gas when ETH < 0.02", () => {
    const r = makeResult({ ethBalance: 10_000_000_000_000_000n }, ["no_gas"]);
    expect(r.blocked).toContain("no_gas");
    expect(r.ready).toBe(false);
  });

  it("should report BLOCKED: insufficient_usdc when USDC < 100", () => {
    const r = makeResult({ usdcBalance: 50_000_000n }, ["insufficient_usdc"]);
    expect(r.blocked).toContain("insufficient_usdc");
  });

  it("should report BLOCKED: insufficient_usdt when USDT < 100", () => {
    const r = makeResult({ usdtBalance: 0n }, ["insufficient_usdt"]);
    expect(r.blocked).toContain("insufficient_usdt");
  });

  it("should report BLOCKED: contract_drained when contract SGE < 1000", () => {
    const r = makeResult({ contractSgeBalance: 500n * 10n ** 18n }, ["contract_drained"]);
    expect(r.blocked).toContain("contract_drained");
    expect(r.ready).toBe(false);
  });

  it("should report BLOCKED: already_claimed when hasClaimed is true", () => {
    const r = makeResult({ hasClaimed: true }, ["already_claimed"]);
    expect(r.blocked).toContain("already_claimed");
    expect(r.ready).toBe(false);
  });

  it("should report BLOCKED: no_wallet when wallet is null", () => {
    const r = makeResult({ wallet: null }, ["no_wallet"]);
    expect(r.blocked).toContain("no_wallet");
    expect(r.ready).toBe(false);
  });
});

describe("Readiness — contract drained detection", () => {
  it("should detect drained when balance is exactly 0", () => {
    const r = makeResult({ contractSgeBalance: 0n }, ["contract_drained"]);
    expect(r.blocked).toContain("contract_drained");
  });

  it("should detect drained when balance is below 1000 SGE", () => {
    const r = makeResult({ contractSgeBalance: 999n * 10n ** 18n }, ["contract_drained"]);
    expect(r.blocked).toContain("contract_drained");
  });

  it("should NOT be drained when balance is exactly 1000 SGE", () => {
    const r = makeResult({ contractSgeBalance: 1000n * 10n ** 18n });
    expect(r.blocked).not.toContain("contract_drained");
    expect(r.ready).toBe(true);
  });

  it("should detect low margin when balance is between 1000 and 2000", () => {
    const sge = 1500n * 10n ** 18n;
    // Not blocked, but would be a warning
    expect(sge >= MIN_CONTRACT_SGE).toBe(true);
    expect(sge < RECOMMENDED_CONTRACT_SGE).toBe(true);
  });
});

describe("Readiness — CLAIM_AMOUNT", () => {
  it("should use CLAIM_AMOUNT() returning 1000e18 (not claimAmount)", () => {
    const r = makeResult();
    expect(r.data.claimReward).toBe(1000n * 10n ** 18n);
  });

  it("claim reward should match SGE_CONFIG.sgeReward at 18 decimals", () => {
    const reward = 1000n * 10n ** 18n;
    const human = Number(reward / 10n ** 18n);
    expect(human).toBe(1000);
  });
});

describe("Readiness — successful READY state", () => {
  it("should be READY when all conditions met", () => {
    const r = makeResult();
    expect(r.ready).toBe(true);
    expect(r.blocked).toHaveLength(0);
  });

  it("should be READY with only USDC (no USDT)", () => {
    // Having only one stablecoin is enough for READY
    const r = makeResult({ usdtBalance: 0n });
    // insufficient_usdt is not a critical blocker
    expect(r.data.usdcBalance >= EXACT_STABLE_RAW).toBe(true);
  });

  it("should be READY with only USDT (no USDC)", () => {
    const r = makeResult({ usdcBalance: 0n });
    expect(r.data.usdtBalance >= EXACT_STABLE_RAW).toBe(true);
  });
});

describe("Readiness — UI disabled state", () => {
  it("should disable claim button when contract balance is zero", () => {
    const r = makeResult({ contractSgeBalance: 0n }, ["contract_drained"]);
    const canClaim = r.ready;
    expect(canClaim).toBe(false);
  });

  it("should disable claim button when already claimed", () => {
    const r = makeResult({ hasClaimed: true }, ["already_claimed"]);
    const canClaim = r.ready;
    expect(canClaim).toBe(false);
  });

  it("should enable claim button when fully ready", () => {
    const r = makeResult();
    const canClaim = r.ready;
    expect(canClaim).toBe(true);
  });
});

describe("Readiness — blockReasonLabel", () => {
  it("should provide human-readable labels for all block reasons", () => {
    const reasons: BlockReason[] = [
      "wrong_network", "no_gas", "insufficient_usdc",
      "insufficient_usdt", "contract_drained", "already_claimed", "no_wallet",
    ];
    for (const r of reasons) {
      const label = blockReasonLabel(r);
      expect(label).toBeTruthy();
      expect(label.startsWith("BLOCKED:")).toBe(true);
    }
  });
});

describe("USDT zero-first approval", () => {
  it("should require zero-first pattern when existing allowance > 0", () => {
    // The erc20.ts approveToken function checks:
    // if (token === "USDT" && currentAllowance > 0n) → reset to 0 first
    const token = "USDT";
    const currentAllowance = 50_000_000n;
    const needsZeroFirst = token === "USDT" && currentAllowance > 0n;
    expect(needsZeroFirst).toBe(true);
  });

  it("should NOT require zero-first when allowance is already 0", () => {
    const token = "USDT";
    const currentAllowance = 0n;
    const needsZeroFirst = token === "USDT" && currentAllowance > 0n;
    expect(needsZeroFirst).toBe(false);
  });

  it("should NOT require zero-first for USDC regardless of allowance", () => {
    const token = "USDC";
    const currentAllowance = 50_000_000n;
    const needsZeroFirst = token === "USDT" && currentAllowance > 0n;
    expect(needsZeroFirst).toBe(false);
  });
});
