// ─────────────────────────────────────────────
// SGE Legacy — Canonical Deployed Address Registry
// ─────────────────────────────────────────────
// Single source of truth for all deployed contract
// addresses. Resolution order:
//
//   1. Environment variables (highest priority)
//   2. deployment-manifest.json (written by deploy script)
//   3. SGE_CONFIG hardcoded values (fallback)
//
// All scripts, readiness checks, and admin UI
// should read addresses through this module.

import { SGE_CONFIG } from "@/lib/config/sge";

// ── Types ────────────────────────────────────

export interface DeployedAddresses {
  /** SGE Token (legacy, non-standard ERC-20) */
  sgeToken: string;
  /** New SgeDistributor proxy */
  distributor: string;
  /** New SgeTreasuryVault */
  treasury: string;
  /** New SgeAccessManager */
  accessManager: string;
  /** Admin / deployer wallet */
  admin: string;
  /** Operator wallet (distributes, overrides) */
  operator: string;
  /** Original (legacy) claim contract — DRAINED */
  claimContract: string;
}

export interface DeploymentManifest {
  network: string;
  deployer: string;
  timestamp: string;
  contracts: {
    SgeAccessManager: string;
    SgeTreasuryVault: string;
    SgeDistributor: string;
  };
  linkedToken: string;
  claimAmount: string;
}

export interface AddressValidation {
  field: string;
  address: string;
  valid: boolean;
  source: "env" | "manifest" | "config" | "empty";
  warning?: string;
}

// ── Address Validation ───────────────────────

const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export function isValidAddress(addr: string): boolean {
  return ETH_ADDRESS_RE.test(addr);
}

// ── Manifest Loading ─────────────────────────

let _manifestCache: DeploymentManifest | null = null;
let _manifestLoaded = false;

/**
 * Attempt to load the deployment manifest from disk.
 * Returns null if the file doesn't exist or can't be parsed.
 * Only runs in Node (server / CLI); returns null in browser.
 */
export function loadManifest(): DeploymentManifest | null {
  if (_manifestLoaded) return _manifestCache;
  _manifestLoaded = true;

  if (typeof window !== "undefined") return null; // Browser — no fs access

  try {
    const fs = require("node:fs");
    const path = require("node:path");

    // deployment-manifest.json lives at apps/web/deployment-manifest.json
    const candidates = [
      path.resolve(process.cwd(), "apps/web/deployment-manifest.json"),
      path.resolve(process.cwd(), "deployment-manifest.json"),
      path.resolve(__dirname, "../../../../deployment-manifest.json"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        _manifestCache = JSON.parse(raw) as DeploymentManifest;
        return _manifestCache;
      }
    }
  } catch {
    // Non-fatal — fall through to env / config
  }
  return null;
}

/** Force-clear the manifest cache (useful for tests). */
export function clearManifestCache(): void {
  _manifestCache = null;
  _manifestLoaded = false;
}

// ── Canonical Address Resolution ─────────────

/**
 * Resolves addresses in priority order:
 *   1. Env var → 2. Manifest → 3. SGE_CONFIG → 4. ""
 */
export function getDeployedAddresses(): DeployedAddresses {
  const manifest = loadManifest();

  return {
    sgeToken:
      env("SGE_TOKEN_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_TOKEN_ADDRESS") ??
      manifest?.linkedToken ??
      SGE_CONFIG.sgeToken,

    distributor:
      env("SGE_DISTRIBUTOR_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS") ??
      manifest?.contracts?.SgeDistributor ??
      "",

    treasury:
      env("SGE_TREASURY_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_TREASURY_ADDRESS") ??
      manifest?.contracts?.SgeTreasuryVault ??
      "",

    accessManager:
      env("SGE_ACCESS_MANAGER_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS") ??
      manifest?.contracts?.SgeAccessManager ??
      "",

    admin:
      env("SGE_ADMIN_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_ADMIN_ADDRESS") ??
      manifest?.deployer ??
      SGE_CONFIG.contractOwner,

    operator:
      env("SGE_OPERATOR_ADDRESS") ??
      env("NEXT_PUBLIC_SGE_OPERATOR_ADDRESS") ??
      "",

    claimContract:
      env("CLAIM_CONTRACT_ADDRESS") ??
      env("NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS") ??
      SGE_CONFIG.claimContract,
  };
}

// ── Validation ───────────────────────────────

/**
 * Validates all addresses and reports their source + validity.
 * Useful for preflight and admin UI diagnostics.
 */
export function validateAddresses(): AddressValidation[] {
  const manifest = loadManifest();
  const addrs = getDeployedAddresses();
  const results: AddressValidation[] = [];

  const fields: { field: keyof DeployedAddresses; required: boolean }[] = [
    { field: "sgeToken", required: true },
    { field: "distributor", required: true },
    { field: "treasury", required: true },
    { field: "accessManager", required: true },
    { field: "admin", required: true },
    { field: "operator", required: false },
    { field: "claimContract", required: false },
  ];

  for (const { field, required } of fields) {
    const addr = addrs[field];
    const source = resolveSource(field, manifest);
    const valid = addr ? isValidAddress(addr) : false;

    const warnings: string[] = [];
    if (!addr && required) warnings.push("Address not configured — required for operation");
    if (addr && !valid) warnings.push("Invalid Ethereum address format");

    results.push({
      field,
      address: addr,
      valid: addr ? valid : !required,
      source,
      warning: warnings.length > 0 ? warnings.join("; ") : undefined,
    });
  }

  // Cross-check: if manifest AND env are set, warn on mismatch
  if (manifest) {
    const envDist = env("SGE_DISTRIBUTOR_ADDRESS");
    if (envDist && manifest.contracts?.SgeDistributor && envDist.toLowerCase() !== manifest.contracts.SgeDistributor.toLowerCase()) {
      const existing = results.find((r) => r.field === "distributor");
      if (existing) existing.warning = `ENV (${envDist}) ≠ manifest (${manifest.contracts.SgeDistributor}) — address drift detected`;
    }

    const envVault = env("SGE_TREASURY_ADDRESS");
    if (envVault && manifest.contracts?.SgeTreasuryVault && envVault.toLowerCase() !== manifest.contracts.SgeTreasuryVault.toLowerCase()) {
      const existing = results.find((r) => r.field === "treasury");
      if (existing) existing.warning = `ENV (${envVault}) ≠ manifest (${manifest.contracts.SgeTreasuryVault}) — address drift detected`;
    }

    const envAM = env("SGE_ACCESS_MANAGER_ADDRESS");
    if (envAM && manifest.contracts?.SgeAccessManager && envAM.toLowerCase() !== manifest.contracts.SgeAccessManager.toLowerCase()) {
      const existing = results.find((r) => r.field === "accessManager");
      if (existing) existing.warning = `ENV (${envAM}) ≠ manifest (${manifest.contracts.SgeAccessManager}) — address drift detected`;
    }
  }

  return results;
}

// ── Helpers ──────────────────────────────────

function env(name: string): string | undefined {
  const val = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return val && val.length > 0 ? val : undefined;
}

function resolveSource(
  field: keyof DeployedAddresses,
  manifest: DeploymentManifest | null
): AddressValidation["source"] {
  const envNames: Record<keyof DeployedAddresses, string[]> = {
    sgeToken: ["SGE_TOKEN_ADDRESS", "NEXT_PUBLIC_SGE_TOKEN_ADDRESS"],
    distributor: ["SGE_DISTRIBUTOR_ADDRESS", "NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS"],
    treasury: ["SGE_TREASURY_ADDRESS", "NEXT_PUBLIC_SGE_TREASURY_ADDRESS"],
    accessManager: ["SGE_ACCESS_MANAGER_ADDRESS", "NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS"],
    admin: ["SGE_ADMIN_ADDRESS", "NEXT_PUBLIC_SGE_ADMIN_ADDRESS"],
    operator: ["SGE_OPERATOR_ADDRESS", "NEXT_PUBLIC_SGE_OPERATOR_ADDRESS"],
    claimContract: ["CLAIM_CONTRACT_ADDRESS", "NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS"],
  };

  for (const name of envNames[field]) {
    if (env(name)) return "env";
  }

  const manifestFields: Partial<Record<keyof DeployedAddresses, string>> = {
    distributor: "SgeDistributor",
    treasury: "SgeTreasuryVault",
    accessManager: "SgeAccessManager",
    sgeToken: "_linkedToken",
    admin: "_deployer",
  };

  if (manifest && manifestFields[field]) {
    const key = manifestFields[field]!;
    if (key === "_linkedToken" && manifest.linkedToken) return "manifest";
    if (key === "_deployer" && manifest.deployer) return "manifest";
    if ((manifest.contracts as any)?.[key]) return "manifest";
  }

  // If we have a value from SGE_CONFIG or it's empty
  const addrs = getDeployedAddresses();
  return addrs[field] ? "config" : "empty";
}
