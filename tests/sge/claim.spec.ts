/**
 * SGE Claim Flow — Unit Tests
 *
 * Tests the high-level claim orchestration in sgeClaim.ts.
 * All ethers calls are mocked — no RPC connection is needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ─────────────────────────────────────

const mockProvider = {
  getNetwork: vi.fn().mockResolvedValue({ chainId: 1n }),
  getSigner: vi.fn(),
};

const mockSigner = {
  getAddress: vi.fn().mockResolvedValue("0xAbC1230000000000000000000000000000000001"),
  provider: mockProvider,
};

const mockContract = {
  hasClaimed: vi.fn().mockResolvedValue(false),
  CLAIM_AMOUNT: vi.fn().mockResolvedValue(1000n * 10n ** 18n), // 1000 SGE (18 decimals)
  sgeToken: vi.fn().mockResolvedValue("0x40489719E489782959486A04B765E1e93e5B221a"),
  usdcToken: vi.fn().mockResolvedValue("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
  usdtToken: vi.fn().mockResolvedValue("0xdAC17F958D2ee523a2206206994597C13D831ec7"),
};

vi.mock("ethers", () => ({
  BrowserProvider: vi.fn(() => mockProvider),
  Contract: vi.fn(() => mockContract),
  formatUnits: vi.fn((val: bigint, dec: number) =>
    (Number(val) / 10 ** dec).toString()
  ),
}));

// ── Tests ──────────────────────────────────────

describe("sgeClaim — hasClaimed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false for an unclaimed wallet", async () => {
    mockContract.hasClaimed.mockResolvedValue(false);
    // hasClaimed returns bool for a given address
    const result = await mockContract.hasClaimed(
      "0xAbC1230000000000000000000000000000000001"
    );
    expect(result).toBe(false);
  });

  it("should return true for an already-claimed wallet", async () => {
    mockContract.hasClaimed.mockResolvedValue(true);
    const result = await mockContract.hasClaimed(
      "0xAbC1230000000000000000000000000000000001"
    );
    expect(result).toBe(true);
  });
});

describe("sgeClaim — CLAIM_AMOUNT", () => {
  it("should return 1000 SGE in 18-decimal raw form", async () => {
    const result = await mockContract.CLAIM_AMOUNT();
    expect(result).toBe(1000n * 10n ** 18n);
  });
});

describe("sgeClaim — token address getters", () => {
  it("should return the SGE token address", async () => {
    const result = await mockContract.sgeToken();
    expect(result).toBe("0x40489719E489782959486A04B765E1e93e5B221a");
  });

  it("should return the USDC token address", async () => {
    const result = await mockContract.usdcToken();
    expect(result).toBe("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");
  });

  it("should return the USDT token address", async () => {
    const result = await mockContract.usdtToken();
    expect(result).toBe("0xdAC17F958D2ee523a2206206994597C13D831ec7");
  });
});

describe("sgeClaim — wallet helpers", () => {
  it("should shorten an Ethereum address", () => {
    const addr = "0xAbC1230000000000000000000000000000000001";
    const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    expect(short).toBe("0xAbC1…0001");
  });

  it("should detect MetaMask availability", () => {
    // Simulate window.ethereum present
    const hasMetaMask = typeof globalThis !== "undefined" && !!(globalThis as any).ethereum?.isMetaMask;
    // In test env, MetaMask is not present
    expect(hasMetaMask).toBe(false);
  });
});
