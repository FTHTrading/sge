/**
 * SGE Legacy Token Adapter — Unit Tests
 *
 * Tests the legacy adapter config, ABI definitions,
 * client helpers, and readiness module.
 * All chain reads are mocked — no RPC connection needed.
 */

import { describe, it, expect } from "vitest";
import {
  SGE_LEGACY_TOKEN,
  legacyTokenExplorerUrl,
  legacyExplorerAddressUrl,
} from "@/lib/sge-legacy/config";
import {
  SGE_LEGACY_ABI,
  SGE_LEGACY_READ_ABI,
  SGE_LEGACY_WRITE_ABI,
} from "@/lib/sge-legacy/abi";
import {
  LEGACY_WARNINGS,
  formatSGE,
  parseSGE,
} from "@/lib/sge-legacy/client";

// ═══════════════════════════════════════════════
// Config Tests
// ═══════════════════════════════════════════════

describe("SGE_LEGACY_TOKEN config", () => {
  it("has the correct token address", () => {
    expect(SGE_LEGACY_TOKEN.address).toBe("0x40489719E489782959486A04B765E1e93e5B221a");
  });

  it("has correct metadata", () => {
    expect(SGE_LEGACY_TOKEN.name).toBe("Scalable Green Energy");
    expect(SGE_LEGACY_TOKEN.symbol).toBe("SGE");
    expect(SGE_LEGACY_TOKEN.decimals).toBe(18);
    expect(SGE_LEGACY_TOKEN.chainId).toBe(1);
  });

  it("documents legacy quirks correctly", () => {
    const { legacy } = SGE_LEGACY_TOKEN;
    expect(legacy.transferReturnsBool).toBe(false);
    expect(legacy.emitsApprovalEvent).toBe(false);
    expect(legacy.approveRaceCondition).toBe(true);
    expect(legacy.modernSolidity).toBe(false);
    expect(legacy.hasAdmin).toBe(false);
    expect(legacy.hasPause).toBe(false);
    expect(legacy.hasRescue).toBe(false);
    expect(legacy.hasRoles).toBe(false);
    expect(legacy.hasComplianceHooks).toBe(false);
    expect(legacy.isUpgradeable).toBe(false);
  });

  it("generates correct explorer URLs", () => {
    expect(legacyTokenExplorerUrl()).toContain("0x40489719E489782959486A04B765E1e93e5B221a");
    expect(legacyTokenExplorerUrl()).toContain("etherscan.io");
  });

  it("generates correct address explorer URLs", () => {
    const url = legacyExplorerAddressUrl("0xABC123");
    expect(url).toContain("0xABC123");
    expect(url).toContain("etherscan.io");
  });
});

// ═══════════════════════════════════════════════
// ABI Tests
// ═══════════════════════════════════════════════

describe("SGE Legacy ABIs", () => {
  it("READ_ABI has 6 view functions", () => {
    expect(SGE_LEGACY_READ_ABI).toHaveLength(6);
    // All should be "function ... view"
    for (const fn of SGE_LEGACY_READ_ABI) {
      expect(fn).toContain("view");
    }
  });

  it("WRITE_ABI has 3 state-changing functions", () => {
    expect(SGE_LEGACY_WRITE_ABI).toHaveLength(3);
    for (const fn of SGE_LEGACY_WRITE_ABI) {
      expect(fn).not.toContain("view");
      // Legacy write functions have NO return type
      expect(fn).not.toContain("returns");
    }
  });

  it("combined ABI includes all functions", () => {
    expect(SGE_LEGACY_ABI.length).toBe(
      SGE_LEGACY_READ_ABI.length + SGE_LEGACY_WRITE_ABI.length
    );
  });

  it("READ_ABI includes standard ERC-20 views", () => {
    const names = SGE_LEGACY_READ_ABI.join(" ");
    expect(names).toContain("name");
    expect(names).toContain("symbol");
    expect(names).toContain("decimals");
    expect(names).toContain("totalSupply");
    expect(names).toContain("balanceOf");
    expect(names).toContain("allowance");
  });

  it("WRITE_ABI includes transfer, transferFrom, approve", () => {
    const names = SGE_LEGACY_WRITE_ABI.join(" ");
    expect(names).toContain("transfer");
    expect(names).toContain("transferFrom");
    expect(names).toContain("approve");
  });
});

// ═══════════════════════════════════════════════
// Client Helper Tests
// ═══════════════════════════════════════════════

describe("LEGACY_WARNINGS", () => {
  it("has exactly 4 warning entries", () => {
    expect(Object.keys(LEGACY_WARNINGS)).toHaveLength(4);
  });

  it("includes key warnings", () => {
    expect(LEGACY_WARNINGS.TRANSFER_NO_BOOL).toBeDefined();
    expect(LEGACY_WARNINGS.NO_APPROVAL_EVENT).toBeDefined();
    expect(LEGACY_WARNINGS.APPROVE_RACE_CONDITION).toBeDefined();
    expect(LEGACY_WARNINGS.IMMUTABLE_TOKEN).toBeDefined();
  });

  it("warning messages are descriptive strings", () => {
    for (const val of Object.values(LEGACY_WARNINGS)) {
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(10);
    }
  });
});

describe("formatSGE", () => {
  it("formats 1e18 as 1.00", () => {
    const formatted = formatSGE(10n ** 18n);
    expect(formatted).toBe("1.00");
  });

  it("formats 1000e18 correctly", () => {
    const formatted = formatSGE(1000n * 10n ** 18n);
    expect(formatted).toBe("1000.00");
  });

  it("formats 0 as 0.00", () => {
    expect(formatSGE(0n)).toBe("0.00");
  });

  it("formats fractional amounts", () => {
    // 1.5 SGE = 1500000000000000000
    const formatted = formatSGE(1_500_000_000_000_000_000n);
    expect(formatted).toBe("1.50");
  });
});

describe("parseSGE", () => {
  it("parses '1.0' to 1e18", () => {
    expect(parseSGE("1.0")).toBe(10n ** 18n);
  });

  it("parses '1000' to 1000e18", () => {
    expect(parseSGE("1000")).toBe(1000n * 10n ** 18n);
  });

  it("parses '0' to 0n", () => {
    expect(parseSGE("0")).toBe(0n);
  });

  it("roundtrips formatSGE ↔ parseSGE", () => {
    const original = 12345n * 10n ** 18n;
    const formatted = formatSGE(original);
    const parsed = parseSGE(formatted);
    expect(parsed).toBe(original);
  });
});

// ═══════════════════════════════════════════════
// Script Config Tests
// ═══════════════════════════════════════════════

describe("Script config", () => {
  it("LEGACY_ADDRESSES has expected keys", async () => {
    const { LEGACY_ADDRESSES } = await import("@/lib/sge-legacy/script-config");
    expect(LEGACY_ADDRESSES.sgeToken).toBe("0x40489719E489782959486A04B765E1e93e5B221a");
    expect(LEGACY_ADDRESSES).toHaveProperty("distributor");
    expect(LEGACY_ADDRESSES).toHaveProperty("treasury");
    expect(LEGACY_ADDRESSES).toHaveProperty("accessManager");
    expect(LEGACY_ADDRESSES).toHaveProperty("admin");
    expect(LEGACY_ADDRESSES).toHaveProperty("operator");
    expect(LEGACY_ADDRESSES).toHaveProperty("claimContract");
  });

  it("DISTRIBUTOR_ABI contains expected functions", async () => {
    const { DISTRIBUTOR_ABI } = await import("@/lib/sge-legacy/script-config");
    const joined = DISTRIBUTOR_ABI.join(" ");
    expect(joined).toContain("fundInventory");
    expect(joined).toContain("distribute");
    expect(joined).toContain("claimExact");
    expect(joined).toContain("pause");
    expect(joined).toContain("unpause");
    expect(joined).toContain("inventoryBalance");
    expect(joined).toContain("drainToTreasury");
  });

  it("VAULT_ABI contains expected functions", async () => {
    const { VAULT_ABI } = await import("@/lib/sge-legacy/script-config");
    const joined = VAULT_ABI.join(" ");
    expect(joined).toContain("deposit");
    expect(joined).toContain("release");
    expect(joined).toContain("balance");
    expect(joined).toContain("emergencyWithdraw");
  });

  it("ACCESS_MANAGER_ABI contains canAccess", async () => {
    const { ACCESS_MANAGER_ABI } = await import("@/lib/sge-legacy/script-config");
    const joined = ACCESS_MANAGER_ABI.join(" ");
    expect(joined).toContain("canAccess");
    expect(joined).toContain("allowlistEnabled");
    expect(joined).toContain("kycRequired");
  });

  it("ERC20_ABI has standard functions", async () => {
    const { ERC20_ABI } = await import("@/lib/sge-legacy/script-config");
    const joined = ERC20_ABI.join(" ");
    expect(joined).toContain("balanceOf");
    expect(joined).toContain("decimals");
    expect(joined).toContain("approve");
    expect(joined).toContain("transfer");
  });
});

// ═══════════════════════════════════════════════
// Readiness Module Tests
// ═══════════════════════════════════════════════

describe("Readiness module", () => {
  it("exports readinessVerdict", async () => {
    const { readinessVerdict } = await import("@/lib/sge-legacy/readiness");
    expect(typeof readinessVerdict).toBe("function");
  });

  it("readinessVerdict returns BLOCKED for failures", async () => {
    const { readinessVerdict } = await import("@/lib/sge-legacy/readiness");
    const result = {
      ready: false,
      timestamp: new Date().toISOString(),
      checks: [{ id: "test", label: "Test", status: "fail" as const, detail: "bad", subsystem: "rpc" as const }],
      summary: { pass: 0, fail: 1, warn: 0, skip: 0, total: 1 },
    };
    const verdict = readinessVerdict(result);
    expect(verdict.label).toBe("BLOCKED");
    expect(verdict.color).toBe("red");
  });

  it("readinessVerdict returns READY for all pass", async () => {
    const { readinessVerdict } = await import("@/lib/sge-legacy/readiness");
    const result = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: [{ id: "test", label: "Test", status: "pass" as const, detail: "ok", subsystem: "rpc" as const }],
      summary: { pass: 1, fail: 0, warn: 0, skip: 0, total: 1 },
    };
    const verdict = readinessVerdict(result);
    expect(verdict.label).toBe("READY");
    expect(verdict.color).toBe("emerald");
  });

  it("readinessVerdict returns warnings for mixed", async () => {
    const { readinessVerdict } = await import("@/lib/sge-legacy/readiness");
    const result = {
      ready: true,
      timestamp: new Date().toISOString(),
      checks: [],
      summary: { pass: 2, fail: 0, warn: 1, skip: 0, total: 3 },
    };
    const verdict = readinessVerdict(result);
    expect(verdict.label).toContain("warnings");
    expect(verdict.color).toBe("amber");
  });

  it("checkLegacyReadiness is exported and callable", async () => {
    const { checkLegacyReadiness } = await import("@/lib/sge-legacy/readiness");
    expect(typeof checkLegacyReadiness).toBe("function");
  });
});
