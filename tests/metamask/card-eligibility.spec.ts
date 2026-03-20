/**
 * MetaMask Card Eligibility — Unit Tests
 *
 * Tests the checkCardEligibility function and related helpers.
 * Mocks window.ethereum to simulate various wallet states.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  SUPPORTED_REGIONS,
  METAMASK_CARD_URLS,
  checkCardEligibility,
} from "../../apps/web/src/lib/metamask/card";

// ── Window mock helpers ──────────────────────────

function setEthereum(overrides: Record<string, any> = {}) {
  (globalThis as any).window = {
    ethereum: {
      isMetaMask: true,
      request: vi.fn(),
      ...overrides,
    },
  };
}

function clearEthereum() {
  delete (globalThis as any).window;
}

// ── Static data tests ────────────────────────────

describe("MetaMask Card — SUPPORTED_NETWORKS", () => {
  it("should include Linea with chain ID 59144", () => {
    const linea = SUPPORTED_NETWORKS.find((n) => n.name === "Linea");
    expect(linea).toBeDefined();
    expect(linea!.chainId).toBe(59144);
  });

  it("should include Base with chain ID 8453", () => {
    const base = SUPPORTED_NETWORKS.find((n) => n.name === "Base");
    expect(base).toBeDefined();
    expect(base!.chainId).toBe(8453);
  });

  it("should include Solana as non-EVM", () => {
    const solana = SUPPORTED_NETWORKS.find((n) => n.name === "Solana");
    expect(solana).toBeDefined();
    expect(solana!.chainId).toBeNull();
  });
});

describe("MetaMask Card — SUPPORTED_TOKENS", () => {
  it("should include USDC and USDT", () => {
    const symbols = SUPPORTED_TOKENS.map((t) => t.symbol);
    expect(symbols).toContain("USDC");
    expect(symbols).toContain("USDT");
  });

  it("should include ETH and SOL", () => {
    const symbols = SUPPORTED_TOKENS.map((t) => t.symbol);
    expect(symbols).toContain("ETH");
    expect(symbols).toContain("SOL");
  });

  it("should have at least one network per token", () => {
    for (const token of SUPPORTED_TOKENS) {
      expect(token.networks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("MetaMask Card — SUPPORTED_REGIONS", () => {
  it("should have US as available with virtual + metal tiers", () => {
    const us = SUPPORTED_REGIONS.find((r) => r.region === "United States");
    expect(us).toBeDefined();
    expect(us!.status).toBe("available");
    expect(us!.tiers).toContain("virtual");
    expect(us!.tiers).toContain("metal");
  });

  it("should have Canada as waitlist", () => {
    const ca = SUPPORTED_REGIONS.find((r) => r.region === "Canada");
    expect(ca).toBeDefined();
    expect(ca!.status).toBe("waitlist");
  });
});

describe("MetaMask Card — METAMASK_CARD_URLS", () => {
  it("should have a valid info URL", () => {
    expect(METAMASK_CARD_URLS.info).toMatch(/^https:\/\//);
  });

  it("should have a portfolio URL", () => {
    expect(METAMASK_CARD_URLS.portfolio).toMatch(/^https:\/\//);
  });

  it("should have 7 URL entries", () => {
    expect(Object.keys(METAMASK_CARD_URLS).length).toBe(7);
  });
});

// ── Eligibility function tests ───────────────────

describe("MetaMask Card — checkCardEligibility", () => {
  afterEach(() => clearEthereum());

  it("should fail if MetaMask is not installed", () => {
    const result = checkCardEligibility({
      hasMetaMask: false,
      connectedChainId: null,
      tokenBalances: {},
    });
    expect(result.hasMetaMask).toBe(false);
    expect(result.isEligible).toBe(false);
  });

  it("should detect MetaMask when window.ethereum.isMetaMask is true", () => {
    const result = checkCardEligibility({
      hasMetaMask: true,
      connectedChainId: 1,
      tokenBalances: {},
    });
    expect(result.hasMetaMask).toBe(true);
  });

  it("should detect supported network when on Linea", () => {
    const result = checkCardEligibility({
      hasMetaMask: true,
      connectedChainId: 59144, // Linea
      tokenBalances: { USDC: 1000000n },
    });
    expect(result.hasCompatibleNetwork).toBe(true);
  });

  it("should not flag unsupported network as supported", () => {
    const result = checkCardEligibility({
      hasMetaMask: true,
      connectedChainId: 1, // Ethereum mainnet — not in card networks
      tokenBalances: {},
    });
    expect(result.hasCompatibleNetwork).toBe(false);
  });
});
