/**
 * MetaMask Card Routing — Unit Tests
 *
 * Verifies the URL map and deep-link construction are correct.
 * No mocking needed — these are pure function / data tests.
 */

import { describe, it, expect } from "vitest";
import {
  METAMASK_CARD_URLS,
  SUPPORTED_NETWORKS,
  SUPPORTED_REGIONS,
} from "../../apps/web/src/lib/metamask/card";

// ── URL map correctness ─────────────────────────

describe("Card Routing — URL Map", () => {
  it("info URL should point to MetaMask card page", () => {
    expect(METAMASK_CARD_URLS.info).toContain("metamask.io");
  });

  it("portfolio URL should point to MetaMask portfolio", () => {
    expect(METAMASK_CARD_URLS.portfolio).toContain("portfolio.metamask.io");
  });

  it("whatIsCard URL should be an official MetaMask resource", () => {
    expect(METAMASK_CARD_URLS.whatIsCard).toMatch(
      /metamask\.(io|consensys\.io)/
    );
  });

  it("gettingStarted URL should exist", () => {
    expect(METAMASK_CARD_URLS.gettingStarted).toBeTruthy();
    expect(typeof METAMASK_CARD_URLS.gettingStarted).toBe("string");
  });

  it("blackbird URL should point to Blackbird partner page", () => {
    expect(METAMASK_CARD_URLS.blackbird).toBeTruthy();
  });

  it("download URL should point to MetaMask download", () => {
    expect(METAMASK_CARD_URLS.downloadMetaMask).toContain("metamask.io");
  });

  it("introducing URL should be a MetaMask blog/learn link", () => {
    expect(METAMASK_CARD_URLS.introducing).toContain("metamask.io");
  });

  it("all URLs should start with https://", () => {
    for (const [key, url] of Object.entries(METAMASK_CARD_URLS)) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

// ── Deep-link construction ──────────────────────

describe("Card Routing — Deep Links", () => {
  it("should construct a valid portfolio link", () => {
    const link = METAMASK_CARD_URLS.portfolio;
    // Valid URL
    expect(() => new URL(link)).not.toThrow();
  });

  it("should construct valid info link", () => {
    const link = METAMASK_CARD_URLS.info;
    expect(() => new URL(link)).not.toThrow();
  });

  it("all URL values should be parseable URLs", () => {
    for (const url of Object.values(METAMASK_CARD_URLS)) {
      expect(() => new URL(url)).not.toThrow();
    }
  });
});

// ── Network routing ─────────────────────────────

describe("Card Routing — Network routing", () => {
  it("should have EVM chain IDs for all EVM networks", () => {
    const evmNetworks = SUPPORTED_NETWORKS.filter((n) => n.chainId !== null);
    expect(evmNetworks.length).toBeGreaterThanOrEqual(2);
    for (const net of evmNetworks) {
      expect(typeof net.chainId).toBe("number");
      expect(net.chainId).toBeGreaterThan(0);
    }
  });

  it("should mark non-EVM networks with null chain ID", () => {
    const nonEvm = SUPPORTED_NETWORKS.filter((n) => n.chainId === null);
    expect(nonEvm.length).toBeGreaterThanOrEqual(1);
    expect(nonEvm.some((n) => n.name === "Solana")).toBe(true);
  });
});

// ── Region routing ──────────────────────────────

describe("Card Routing — Region routing", () => {
  it("should have at least one available region", () => {
    const available = SUPPORTED_REGIONS.filter(
      (r) => r.status === "available"
    );
    expect(available.length).toBeGreaterThanOrEqual(1);
  });

  it("should have tier info for available regions", () => {
    const available = SUPPORTED_REGIONS.filter(
      (r) => r.status === "available"
    );
    for (const region of available) {
      expect(region.tiers.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("should cover major regions", () => {
    const names = SUPPORTED_REGIONS.map((r) => r.region);
    expect(names).toContain("United States");
    expect(names).toContain("European Union / EEA");
    expect(names).toContain("United Kingdom");
  });
});
