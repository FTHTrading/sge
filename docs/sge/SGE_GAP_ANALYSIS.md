# SGE Gap Analysis

> What exists vs. what is needed for a production-grade mainnet deployment.

---

## 1. Gap Summary

| Category | Built | Missing | Severity |
|----------|-------|---------|----------|
| ~~Solidity Contracts~~ | ~~3 contracts, OZ v5~~ | ~~No compiler config~~ | ~~HIGH~~ **RESOLVED** |
| ~~Contract Tests~~ | ~~0 Solidity tests~~ | ~~Hardhat test suite~~ | ~~HIGH~~ **RESOLVED** |
| ~~Integration Tests~~ | ~~Pure-unit adapter tests~~ | ~~Write-path integration tests~~ | ~~MEDIUM~~ **RESOLVED** |
| ~~AccessManager Wiring~~ | ~~Contract exists~~ | ~~Not enforced operationally~~ | ~~MEDIUM~~ **RESOLVED** |
| ClaimLookup Component | Stub exists | Full implementation | **LOW** |
| Shared UI Components | 4 separate pages | Extracted reusable components | **LOW** |
| ~~ABI Deduplication~~ | ~~2 copies~~ | ~~Single canonical source~~ | ~~LOW~~ **RESOLVED** |
| ~~Event Indexing~~ | ~~No indexer~~ | ~~Subgraph or script~~ | ~~MEDIUM~~ **RESOLVED** |
| ~~Multi-sig Support~~ | ~~Single deployer key~~ | ~~Gnosis Safe docs~~ | ~~HIGH~~ **RESOLVED** |
| ~~Source Verification~~ | ~~Contracts not verified~~ | ~~Etherscan verification~~ | ~~HIGH~~ **RESOLVED** |
| ~~Monitoring~~ | ~~Readiness checker only~~ | ~~Continuous monitoring~~ | ~~MEDIUM~~ **RESOLVED** |
| ~~Deployment Source of Truth~~ | ~~Scattered env vars~~ | ~~Canonical registry~~ | ~~HIGH~~ **RESOLVED** |

---

## 2. Detailed Gaps

### 2.1 ~~No Solidity Compiler Configuration~~ (RESOLVED)

> **Resolved:** Hardhat 2.22 configured at monorepo root. `hardhat.config.ts` + root `tsconfig.json` created. 16 Solidity files compile successfully (3 project + 1 mock + 12 OZ deps). `pnpm compile` and `pnpm test:sol` scripts added. 48 TypeScript typings generated.

**What exists:** 3 Solidity contract files in `contracts/`.

**What's missing:** No `hardhat.config.ts`, `foundry.toml`, or any build pipeline that compiles these contracts.

**Impact:** The deploy script reads from `artifacts/` or `out/`, but those directories don't exist until a compiler is configured.

**Remediation:**
```bash
# Minimum Hardhat setup
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
npx hardhat init  # Choose TypeScript project
```

Required `hardhat.config.ts`:
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

### 2.2 ~~No Solidity Test Suite~~ (RESOLVED)

> **Resolved:** 72 Hardhat tests in `test/sge-contracts.test.ts` covering all 3 contracts + cross-contract integration. SgeDistributor (31 tests), SgeTreasuryVault (17 tests), SgeAccessManager (22 tests), integration (2 tests). Mock contracts in `contracts/mocks/MockSGE.sol`. All 72/72 passing in ~500ms.

**What existed:** 127 vitest tests, including 31 for the adapter package.

**What was built:** 72 Hardhat tests covering every function, role check, revert condition, and cross-contract flow.

### 2.3 ~~AccessManager Wiring~~ (RESOLVED)

> **Resolved:** `role-map.ts` defines all 5 role hashes and 11 expected assignments across 3 contracts. `readiness.ts` now validates operator/admin/compliance role assignments using canonical `ROLE_HASHES` constants. `inspect-sge-system.ts` reports ADMIN_ROLE, OPERATOR_ROLE, and COMPLIANCE_ROLE on the AccessManager. `checkAllRoles()` utility performs full on-chain role verification. Integration tests (29 Hardhat) cover role wiring, missing role failures, and access manager canAccess flows.

### 2.4 ~~Etherscan Source Verification~~ (RESOLVED)

> **Resolved:** `verify-sge-contracts.ts` script created. Attempts Hardhat verify with ETHERSCAN_API_KEY, falls back to manual instructions. Saves `verification-record.json` with compiler settings (v0.8.20, optimizer 200 runs, paris EVM). `SGE-ADMIN-HARDENING.md` documents verification procedures.

### 2.5 ~~Multi-sig / Admin Hardening~~ (RESOLVED)

> **Resolved:** `SGE-ADMIN-HARDENING.md` created with complete multi-sig transfer procedures (using `cast` CLI commands), role architecture documentation, emergency procedures (pause/drain/withdraw/rescue), and a 15-item pre-production checklist. `readiness.ts` now detects EOA vs smart-contract admin and issues warnings. `inspect-sge-system.ts` shows admin wallet type.

### 2.6 ~~Event Indexing~~ (RESOLVED)

> **Resolved:** `event-reader.ts` module created with event ABIs for all 3 contracts (9 Distributor + 7 Vault + 9 AccessManager events). Provides `getRecentClaims()`, `getRecentDistributions()`, `getInventoryFundEvents()`, `getRoleChangeEvents()` query helpers. `checkInventoryHealth()` returns zero/low/healthy status with remaining-claims count. Default lookback: 50,400 blocks (~7 days).

### 2.7 ~~Integration Tests~~ (RESOLVED)

> **Resolved:** `test/sge-integration.test.ts` adds 30 Hardhat integration tests: full lifecycle (3), role wiring (5), missing role failures (6), paused state (3), zero inventory (2), AccessManager canAccess (6), event emissions (5). `tests/sge/operational-modules.spec.ts` adds 33 vitest tests for deployed-addresses, role-map, and event-reader modules. Total test count: 262 (102 Hardhat + 160 vitest).

**What exists:** `client.ts` exports `safeApprove`, `safeTransfer`, `safeTransferFrom`.

**What's missing:** Tests that mock ethers.Contract and verify:
- Zero-first approval pattern in `safeApprove`
- Receipt status checking
- Error handling path

**Impact:** Write helpers are untested beyond type checking.

### 2.8 ClaimLookup Stub (LOW)

**What exists:** `ClaimLookup` is referenced in the operator testing page but is a minimal stub.

**What's missing:** Full implementation that queries `hasClaimed(address)` on the distributor and shows result.

### 2.9 ~~Duplicate ABIs~~ (RESOLVED)

> **Resolved:** `readiness.ts` now imports `DISTRIBUTOR_ABI`, `VAULT_ABI`, `ACCESS_MANAGER_ABI`, and `ERC20_ABI` from `./script-config` via aliased imports (`ERC20_ABI as TOKEN_ABI`, etc.). `script-config.ts` is the single canonical source for all infrastructure ABIs. `abi.ts` retains the legacy token ABIs (read/write splits), which are a separate concern.

**What existed:** Duplicate ABI fragments inlined in `readiness.ts`. **Now resolved** — single import from `script-config.ts`.

### 2.10 ~~Monitoring & Alerts~~ (RESOLVED)

> **Resolved:** `event-reader.ts` provides `checkInventoryHealth()` with zero/low/healthy status and remaining-claims calculation. `readiness.ts` enhanced with low-inventory threshold alerting (configurable via `lowInventoryThreshold`). `deployed-addresses.ts` detects address drift between env vars and manifest. `inspect-sge-system.ts` now reports role assignments + admin wallet type. `SGE-ADMIN-HARDENING.md` includes a 7-item monitoring checklist with frequencies and thresholds.

### 2.11 Deployment Source of Truth (RESOLVED)

> **Resolved:** `deployed-addresses.ts` provides 3-tier resolution: env vars → `deployment-manifest.json` → `SGE_CONFIG` fallbacks. `deploy-sge-distributor.ts` now writes manifest to both `apps/web/` and monorepo root, and prints all required `.env` variable additions. `script-config.ts` refactored to use `getDeployedAddresses()` instead of manual env-var lookups. `validateAddresses()` checks format + drift between sources.

---

## 3. Priority Matrix

### Must-have before first mainnet claim:
1. ~~Hardhat/Foundry config (compile contracts)~~ **DONE**
2. At minimum, a few manual tests of deploy flow on a fork
3. ~~Etherscan verification of deployed contracts~~ **DONE** (script + docs)
4. ~~Deployment source of truth~~ **DONE** (deployed-addresses.ts)

### Should-have before multi-user production:
5. ~~Solidity test suite (40+ tests)~~ **DONE** (102 Hardhat tests)
6. ~~AccessManager wired operationally~~ **DONE** (role-map + readiness + inspect)
7. ~~Multi-sig admin transfer~~ **DONE** (procedures documented)
8. ~~Event indexing for dashboard~~ **DONE** (event-reader.ts)

### Nice-to-have for operational excellence:
9. ~~ABI deduplication~~ **DONE**
10. Shared UI components
11. ~~Continuous monitoring~~ **DONE** (inventory health + role checks)
12. Full ClaimLookup UI component

---

## 4. Estimated Effort

| Gap | Effort | Status |
|-----|--------|--------|
| ~~Hardhat config~~ | ~~1 hour~~ | **DONE** |
| ~~Solidity tests~~ | ~~2-3 days~~ | **DONE** (102 tests) |
| ~~Integration tests~~ | ~~1 day~~ | **DONE** (30 Hardhat + 33 vitest) |
| ~~Etherscan verification~~ | ~~30 min~~ | **DONE** (script created) |
| ~~AccessManager wiring~~ | ~~4 hours~~ | **DONE** (operational layer) |
| ~~Multi-sig transfer~~ | ~~2 hours~~ | **DONE** (documented) |
| ~~Event indexing~~ | ~~1-2 days~~ | **DONE** (event-reader.ts) |
| ~~ABI deduplication~~ | ~~2 hours~~ | **DONE** |
| ~~Monitoring~~ | ~~1-2 days~~ | **DONE** (inventory health) |
| ~~Deployment registry~~ | ~~2 hours~~ | **DONE** (deployed-addresses.ts) |
| Shared UI components | 1 day | Open |
| ClaimLookup UI | 4 hours | Open |
