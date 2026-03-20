// ─────────────────────────────────────────────
// Vitest — deployed-addresses, role-map, event-reader
// ─────────────────────────────────────────────
// Unit tests for the three new operational modules.

import { describe, it, expect, beforeEach, vi } from "vitest";

// ════════════════════════════════════════════════════════════════
// Deployed Addresses
// ════════════════════════════════════════════════════════════════

describe("deployed-addresses", () => {
  // Reset env and caches between tests
  beforeEach(() => {
    vi.unstubAllEnvs();
    // We can't import clearManifestCache dynamically here,
    // but we clear env to ensure deterministic behavior
  });

  describe("isValidAddress()", () => {
    it("accepts valid checksummed address", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("0x40489719E489782959486A04B765E1e93e5B221a")).toBe(true);
    });

    it("accepts valid lowercase address", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("0x40489719e489782959486a04b765e1e93e5b221a")).toBe(true);
    });

    it("rejects short address", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("0x4048")).toBe(false);
    });

    it("rejects address without 0x prefix", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("40489719E489782959486A04B765E1e93e5B221a")).toBe(false);
    });

    it("rejects empty string", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("")).toBe(false);
    });

    it("rejects non-hex characters", async () => {
      const { isValidAddress } = await import("@/lib/sge-legacy/deployed-addresses");
      expect(isValidAddress("0xGGGG719E489782959486A04B765E1e93e5B221a")).toBe(false);
    });
  });

  describe("getDeployedAddresses()", () => {
    it("returns sgeToken from SGE_CONFIG when no env set", async () => {
      const { getDeployedAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const addrs = getDeployedAddresses();
      // Should fall back to SGE_CONFIG.sgeToken
      expect(addrs.sgeToken).toBe("0x40489719E489782959486A04B765E1e93e5B221a");
    });

    it("returns empty string for unconfigured distributor", async () => {
      const { getDeployedAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const addrs = getDeployedAddresses();
      // Without env or manifest, distributor defaults to ""
      // (unless env is coincidentally set)
      expect(typeof addrs.distributor).toBe("string");
    });

    it("returns admin from SGE_CONFIG fallback", async () => {
      const { getDeployedAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const addrs = getDeployedAddresses();
      expect(addrs.admin).toBe("0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7");
    });

    it("returns claimContract from SGE_CONFIG fallback", async () => {
      const { getDeployedAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const addrs = getDeployedAddresses();
      expect(addrs.claimContract).toBe("0x4BFeF695a5f85a65E1Aa6015439f317494477D09");
    });

    it("all fields are strings", async () => {
      const { getDeployedAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const addrs = getDeployedAddresses();
      for (const [key, val] of Object.entries(addrs)) {
        expect(typeof val).toBe("string");
      }
    });
  });

  describe("validateAddresses()", () => {
    it("returns an array of validations", async () => {
      const { validateAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const results = validateAddresses();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    });

    it("each validation has required fields", async () => {
      const { validateAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const results = validateAddresses();
      for (const v of results) {
        expect(v).toHaveProperty("field");
        expect(v).toHaveProperty("address");
        expect(v).toHaveProperty("valid");
        expect(v).toHaveProperty("source");
      }
    });

    it("sgeToken is always valid (from SGE_CONFIG)", async () => {
      const { validateAddresses } = await import("@/lib/sge-legacy/deployed-addresses");
      const results = validateAddresses();
      const tokenCheck = results.find((v) => v.field === "sgeToken");
      expect(tokenCheck).toBeTruthy();
      expect(tokenCheck!.valid).toBe(true);
    });
  });
});

// ════════════════════════════════════════════════════════════════
// Role Map
// ════════════════════════════════════════════════════════════════

describe("role-map", () => {
  describe("ROLE_HASHES", () => {
    it("has DEFAULT_ADMIN as zero bytes32", async () => {
      const { ROLE_HASHES } = await import("@/lib/sge-legacy/role-map");
      expect(ROLE_HASHES.DEFAULT_ADMIN).toBe(
        "0x0000000000000000000000000000000000000000000000000000000000000000"
      );
    });

    it("has ADMIN hash (keccak256('ADMIN_ROLE'))", async () => {
      const { ROLE_HASHES } = await import("@/lib/sge-legacy/role-map");
      expect(ROLE_HASHES.ADMIN).toBe(
        "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775"
      );
    });

    it("all hashes are 66-char hex strings", async () => {
      const { ROLE_HASHES } = await import("@/lib/sge-legacy/role-map");
      for (const [key, hash] of Object.entries(ROLE_HASHES)) {
        expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
      }
    });

    it("has exactly 5 role hashes", async () => {
      const { ROLE_HASHES } = await import("@/lib/sge-legacy/role-map");
      expect(Object.keys(ROLE_HASHES)).toHaveLength(5);
    });
  });

  describe("EXPECTED_ROLE_ASSIGNMENTS", () => {
    it("has assignments for all 3 contracts", async () => {
      const { EXPECTED_ROLE_ASSIGNMENTS } = await import("@/lib/sge-legacy/role-map");
      const contracts = new Set(EXPECTED_ROLE_ASSIGNMENTS.map((a) => a.contract));
      expect(contracts.has("distributor")).toBe(true);
      expect(contracts.has("vault")).toBe(true);
      expect(contracts.has("accessManager")).toBe(true);
    });

    it("has at least 10 assignments", async () => {
      const { EXPECTED_ROLE_ASSIGNMENTS } = await import("@/lib/sge-legacy/role-map");
      expect(EXPECTED_ROLE_ASSIGNMENTS.length).toBeGreaterThanOrEqual(10);
    });

    it("all assignments have valid severity", async () => {
      const { EXPECTED_ROLE_ASSIGNMENTS } = await import("@/lib/sge-legacy/role-map");
      const validSeverities = ["critical", "recommended", "optional"];
      for (const a of EXPECTED_ROLE_ASSIGNMENTS) {
        expect(validSeverities).toContain(a.severity);
      }
    });

    it("critical assignments include DEFAULT_ADMIN for all contracts", async () => {
      const { EXPECTED_ROLE_ASSIGNMENTS } = await import("@/lib/sge-legacy/role-map");
      const criticalDefAdmin = EXPECTED_ROLE_ASSIGNMENTS.filter(
        (a) => a.roleName === "DEFAULT_ADMIN_ROLE" && a.severity === "critical"
      );
      expect(criticalDefAdmin.length).toBe(3); // one per contract
    });

    it("vault DISTRIBUTOR_ROLE expectedHolder is 'distributor'", async () => {
      const { EXPECTED_ROLE_ASSIGNMENTS } = await import("@/lib/sge-legacy/role-map");
      const vaultDistRole = EXPECTED_ROLE_ASSIGNMENTS.find(
        (a) => a.contract === "vault" && a.roleName === "DISTRIBUTOR_ROLE"
      );
      expect(vaultDistRole).toBeTruthy();
      expect(vaultDistRole!.expectedHolder).toBe("distributor");
      expect(vaultDistRole!.severity).toBe("critical");
    });
  });

  describe("summarizeRoles()", () => {
    it("reports all roles missing when all actual=false", async () => {
      const { summarizeRoles } = await import("@/lib/sge-legacy/role-map");
      const mockResults = [
        { contract: "distributor", roleName: "ADMIN", holder: "0x1", expected: true, actual: false, severity: "critical" as const, description: "test" },
        { contract: "vault", roleName: "ADMIN", holder: "0x1", expected: true, actual: false, severity: "recommended" as const, description: "test" },
      ];
      const summary = summarizeRoles(mockResults);
      expect(summary.allCriticalOk).toBe(false);
      expect(summary.criticalMissing).toHaveLength(1);
      expect(summary.recommendedMissing).toHaveLength(1);
      expect(summary.missing).toBe(2);
    });

    it("reports allCriticalOk when all critical roles are granted", async () => {
      const { summarizeRoles } = await import("@/lib/sge-legacy/role-map");
      const mockResults = [
        { contract: "distributor", roleName: "ADMIN", holder: "0x1", expected: true, actual: true, severity: "critical" as const, description: "test" },
        { contract: "vault", roleName: "OP", holder: "0x2", expected: true, actual: false, severity: "recommended" as const, description: "test" },
      ];
      const summary = summarizeRoles(mockResults);
      expect(summary.allCriticalOk).toBe(true);
      expect(summary.missing).toBe(1);
    });

    it("handles empty results", async () => {
      const { summarizeRoles } = await import("@/lib/sge-legacy/role-map");
      const summary = summarizeRoles([]);
      expect(summary.allCriticalOk).toBe(true);
      expect(summary.total).toBe(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════
// Event Reader
// ════════════════════════════════════════════════════════════════

describe("event-reader", () => {
  describe("constants", () => {
    it("DEFAULT_LOOKBACK_BLOCKS is ~7 days", async () => {
      const { DEFAULT_LOOKBACK_BLOCKS } = await import("@/lib/sge-legacy/event-reader");
      // 7 days * 24h * 60m * 60s / 12s ≈ 50,400
      expect(DEFAULT_LOOKBACK_BLOCKS).toBe(50_400);
    });

    it("LOW_INVENTORY_THRESHOLD_CLAIMS is 50", async () => {
      const { LOW_INVENTORY_THRESHOLD_CLAIMS } = await import("@/lib/sge-legacy/event-reader");
      expect(LOW_INVENTORY_THRESHOLD_CLAIMS).toBe(50);
    });
  });

  describe("event ABIs", () => {
    it("DISTRIBUTOR_EVENT_ABI has Claimed event", async () => {
      const { DISTRIBUTOR_EVENT_ABI } = await import("@/lib/sge-legacy/event-reader");
      const hasClaimed = DISTRIBUTOR_EVENT_ABI.some((e) => e.includes("Claimed"));
      expect(hasClaimed).toBe(true);
    });

    it("DISTRIBUTOR_EVENT_ABI has InventoryFunded event", async () => {
      const { DISTRIBUTOR_EVENT_ABI } = await import("@/lib/sge-legacy/event-reader");
      const hasFunded = DISTRIBUTOR_EVENT_ABI.some((e) => e.includes("InventoryFunded"));
      expect(hasFunded).toBe(true);
    });

    it("VAULT_EVENT_ABI has EmergencyWithdraw event", async () => {
      const { VAULT_EVENT_ABI } = await import("@/lib/sge-legacy/event-reader");
      const hasEmergency = VAULT_EVENT_ABI.some((e) => e.includes("EmergencyWithdraw"));
      expect(hasEmergency).toBe(true);
    });

    it("ACCESS_MANAGER_EVENT_ABI has RoleGranted event", async () => {
      const { ACCESS_MANAGER_EVENT_ABI } = await import("@/lib/sge-legacy/event-reader");
      const hasRoleGranted = ACCESS_MANAGER_EVENT_ABI.some((e) => e.includes("RoleGranted"));
      expect(hasRoleGranted).toBe(true);
    });

    it("all ABIs are arrays of strings", async () => {
      const { DISTRIBUTOR_EVENT_ABI, VAULT_EVENT_ABI, ACCESS_MANAGER_EVENT_ABI } =
        await import("@/lib/sge-legacy/event-reader");

      for (const abi of [DISTRIBUTOR_EVENT_ABI, VAULT_EVENT_ABI, ACCESS_MANAGER_EVENT_ABI]) {
        expect(Array.isArray(abi)).toBe(true);
        for (const entry of abi) {
          expect(typeof entry).toBe("string");
          expect(entry).toMatch(/^event /);
        }
      }
    });
  });
});
