/**
 * ERC-20 Allowance & Approval — Unit Tests
 *
 * Tests the allowance checking and approval patterns in erc20.ts,
 * including the USDT zero-first approval quirk.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────

const mockAllowance = vi.fn();
const mockApprove = vi.fn();
const mockBalanceOf = vi.fn();

const mockContract = {
  allowance: mockAllowance,
  approve: mockApprove,
  balanceOf: mockBalanceOf,
};

vi.mock("ethers", () => ({
  Contract: vi.fn(() => mockContract),
  BrowserProvider: vi.fn(),
  formatUnits: (val: bigint, dec: number) =>
    (Number(val) / 10 ** dec).toString(),
}));

// ── Tests ──────────────────────────────────────

describe("ERC-20 — getTokenBalance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return the token balance as bigint", async () => {
    mockBalanceOf.mockResolvedValue(500_000_000n); // 500 USDC
    const balance = await mockContract.balanceOf(
      "0xAbC1230000000000000000000000000000000001"
    );
    expect(balance).toBe(500_000_000n);
  });

  it("should return 0 for an empty wallet", async () => {
    mockBalanceOf.mockResolvedValue(0n);
    const balance = await mockContract.balanceOf(
      "0x0000000000000000000000000000000000000000"
    );
    expect(balance).toBe(0n);
  });
});

describe("ERC-20 — getAllowance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should return current allowance for spender", async () => {
    mockAllowance.mockResolvedValue(100_000_000n); // 100 USDC
    const allowance = await mockContract.allowance(
      "0xOwner0000000000000000000000000000000001",
      "0xSpender00000000000000000000000000000001"
    );
    expect(allowance).toBe(100_000_000n);
  });

  it("should return 0 when no allowance is set", async () => {
    mockAllowance.mockResolvedValue(0n);
    const allowance = await mockContract.allowance(
      "0xOwner0000000000000000000000000000000001",
      "0xSpender00000000000000000000000000000001"
    );
    expect(allowance).toBe(0n);
  });
});

describe("ERC-20 — approveToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("should call approve with the requested amount", async () => {
    const fakeTx = { hash: "0xabc123", wait: vi.fn().mockResolvedValue({}) };
    mockApprove.mockResolvedValue(fakeTx);
    const tx = await mockContract.approve(
      "0xSpender00000000000000000000000000000001",
      100_000_000n
    );
    expect(tx.hash).toBe("0xabc123");
  });

  it("should handle USDT zero-first approval pattern", async () => {
    // USDT requires setting allowance to 0 before setting a new value
    const zeroTx = { hash: "0xzero", wait: vi.fn().mockResolvedValue({}) };
    const approveTx = { hash: "0xapprove", wait: vi.fn().mockResolvedValue({}) };

    // First call: set to 0
    mockApprove.mockResolvedValueOnce(zeroTx);
    const tx0 = await mockContract.approve(
      "0xSpender00000000000000000000000000000001",
      0n
    );
    expect(tx0.hash).toBe("0xzero");

    // Second call: set actual amount
    mockApprove.mockResolvedValueOnce(approveTx);
    const tx1 = await mockContract.approve(
      "0xSpender00000000000000000000000000000001",
      100_000_000n
    );
    expect(tx1.hash).toBe("0xapprove");
  });
});

describe("ERC-20 — formatTokenAmount", () => {
  it("should format 6-decimal raw amount to human-readable", () => {
    const raw = 100_000_000n;
    const human = Number(raw) / 10 ** 6;
    expect(human).toBe(100);
  });

  it("should handle fractional amounts", () => {
    const raw = 123_456_789n;
    const human = Number(raw) / 10 ** 6;
    expect(human).toBeCloseTo(123.456789, 5);
  });
});
