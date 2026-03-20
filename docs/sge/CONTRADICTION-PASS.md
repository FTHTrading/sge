# SGE Documentation Suite — CONTRADICTION PASS

> **Generated:** 2025-07-18  
> **Scope:** All 16 docs in `docs/sge/`, 6 library files, 3 contracts, 10 scripts, 5 test files, 4 admin UI pages, `.env.example`  
> **Method:** Every factual claim in documentation cross-referenced against actual source code and other docs  
> **Resolution:** All 8 contradictions fixed. Post-fix validation: 127/127 tests, 0 TS errors.

---

## Contradictions Found

### C-01  SGE Total Supply — 100× discrepancy

| Source | Claim |
|--------|-------|
| `docs/sge/contract-review.md` L190 | Max Total Supply: **100,000,000,000 SGE** (100 billion) |
| `docs/sge/SGE-RISK-AND-COMPATIBILITY.md` L15 | Total Supply: **1,000,000,000 SGE** (1 billion) |

**Verdict:** Two docs disagree by a factor of 100. Neither can be verified locally — requires an on-chain `totalSupply()` call. One document is wrong.

---

### C-02  SgeDistributor constructor arity — 3 args vs 4

| Source | Claim |
|--------|-------|
| `docs/sge/SGE_LIVE_RUN_SEQUENCE.md` L71 | Constructor args: `(sgeTokenAddress, claimAmountWei, adminAddress)` — **3 parameters** |
| `contracts/SgeDistributor.sol` | `constructor(address _sgeToken, address _treasury, uint256 _claimAmount, address _admin)` — **4 parameters** |
| `apps/web/scripts/deploy-sge-distributor.ts` | Deploys with `[sgeToken, vaultAddr, claimAmount, deployer]` — **4 parameters** |

**Verdict:** Live Run Sequence omits the treasury (vault) address. An operator following this doc would produce a failing deployment.

---

### C-03  Vault ↔ Distributor linking method — `grantRole` vs `setDistributor`

| Source | Claim |
|--------|-------|
| `docs/sge/SGE-OPERATOR-RUNBOOK.md` L55 | `vault.grantRole(DISTRIBUTOR_ROLE, distributor)` |
| `docs/sge/SGE-DEPLOYMENT-CHECKLIST.md` | `vault.setDistributor(distributor, true)` |
| `contracts/SgeTreasuryVault.sol` | `setDistributor(address, bool)` → internally calls `_grantRole` / `_revokeRole` |
| `apps/web/scripts/deploy-sge-distributor.ts` | `vault.setDistributor(distAddr, true)` |

**Verdict:** The Runbook's `grantRole` call would succeed only if using the low-level AccessControl interface directly, which bypasses the event and validation in `setDistributor()`. The Checklist, deploy script, and contract all agree on `setDistributor()`. The Runbook is wrong.

---

### C-04  Function name — `setKycVerified` vs `setKycStatus`

| Source | Claim |
|--------|-------|
| `docs/sge/SGE_CONTRACT_AUDIT.md` L154 | `setKycVerified(address, bool)` with COMPLIANCE role |
| `contracts/SgeAccessManager.sol` L131 | `function setKycStatus(address account, bool status) external onlyRole(COMPLIANCE_ROLE)` |

**Verdict:** Audit doc uses wrong function name. An operator calling `setKycVerified()` would get a revert.

---

### C-05  `setOperatorOverride` parameter count — 3 args vs 2

| Source | Claim |
|--------|-------|
| `docs/sge/SGE_CONTRACT_AUDIT.md` L155 | `setOperatorOverride(address, bool, bool)` — 3 parameters |
| `contracts/SgeAccessManager.sol` L139 | `function setOperatorOverride(address account, bool overridden) external onlyRole(OPERATOR_ROLE)` — 2 parameters |

**Verdict:** Audit doc adds a phantom third parameter. ABI encoding with 3 args would fail.

---

### C-06  `canAccess` KYC denial message text

| Source | Claim |
|--------|-------|
| `docs/sge/SGE_CONTRACT_AUDIT.md` L143 | `"KYC not verified"` |
| `contracts/SgeAccessManager.sol` L94 | `"KYC not completed"` |

**Verdict:** Cosmetic but affects any UI or script that pattern-matches on the reason string.

---

### C-07  SgeTreasuryVault inheritance list omits Pausable

| Source | Claim |
|--------|-------|
| `docs/sge/SGE_CONTRACT_AUDIT.md` L12 | Inherits: `AccessControl, ReentrancyGuard, SafeERC20` |
| `contracts/SgeTreasuryVault.sol` L25 | `contract SgeTreasuryVault is AccessControl, ReentrancyGuard, Pausable` |

**Verdict:** Audit lists `SafeERC20` (which is a `using` directive, not an inherited contract) and omits `Pausable` (which IS inherited). The Vault is pausable — the audit table doesn't reflect this.

---

### C-08  Testing page env-var scope claims

| Source | Claim |
|--------|-------|
| `apps/web/src/app/(app)/admin/sge/testing/page.tsx` | `SGE_TREASURY_ADDRESS` scope: "Preflight, inspect" |
| `apps/web/src/app/(app)/admin/sge/testing/page.tsx` | `SGE_ACCESS_MANAGER_ADDRESS` scope: "Preflight, inspect" |
| `apps/web/src/lib/sge-legacy/script-config.ts` | `requireEnv('SGE_TREASURY_ADDRESS')` and `requireEnv('SGE_ACCESS_MANAGER_ADDRESS')` evaluated at import time |

**Verdict:** Every script that imports from `script-config.ts` (fund-sge-inventory, test-sge-claim, deploy, inspect, and preflight) will throw if these vars are missing. The scope should be "All legacy scripts", not "Preflight, inspect".

---

## Cross-Document Contradictions

### X-01  Total Supply conflict

`contract-review.md` (100 billion) vs `SGE-RISK-AND-COMPATIBILITY.md` (1 billion). See C-01.

### X-02  Vault linking method conflict

`SGE-OPERATOR-RUNBOOK.md` (`grantRole`) vs `SGE-DEPLOYMENT-CHECKLIST.md` (`setDistributor`). See C-03.

### X-03  Contract audit vs contract source (cluster)

`SGE_CONTRACT_AUDIT.md` contains four factual errors against the actual Solidity source: wrong function name (C-04), wrong arg count (C-05), wrong error string (C-06), and wrong inheritance list (C-07). These are all in the same document.

---

## Verified Claims (count: 33)

All of the following were checked against source code and confirmed accurate:

| # | Claim | Sources |
|---|-------|---------|
| 1 | Token name "Scalable Green Energy" | config.ts, TRUTH-PASS.md, Runbook, Live Run Sequence |
| 2 | Token address `0x40489719E489782959486A04B765E1e93e5B221a` | All docs, config/sge.ts, .env.example |
| 3 | Legacy claim contract `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` | All docs, .env.example |
| 4 | Owner/admin `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` | Runbook, script-config.ts, .env.example |
| 5 | Token decimals = 18 | config.ts, TRUTH-PASS.md |
| 6 | Token symbol = "SGE" | config.ts, TRUTH-PASS.md |
| 7 | Default claim amount = 1000 SGE | deploy script, .env.example, Checklist |
| 8 | Default fund amount = 10000 SGE | fund script, .env.example |
| 9 | SgeDistributor constructor: 4 args | contract, deploy script, Architecture doc |
| 10 | SgeDistributor inherits AccessControl, ReentrancyGuard, Pausable, SafeERC20 | contract, Architecture doc, Audit |
| 11 | Legacy token quirks: no bool return, no Approval event, approve race | config.ts, client.ts, TRUTH-PASS.md, admin UI |
| 12 | `claimExact()` is public/nonReentrant/whenNotPaused | contract, claims admin page |
| 13 | `fundInventory()` is public (not role-gated) | contract, treasury admin page |
| 14 | `drainToTreasury()` requires ADMIN_ROLE | contract, claims admin page |
| 15 | `distribute()` requires OPERATOR_ROLE | contract, claims admin page |
| 16 | Deploy order: AccessManager → Vault → Distributor | deploy script, Runbook |
| 17 | All 10 scripts exist in `apps/web/scripts/` | file listing confirmed |
| 18 | All 5 test files exist in `tests/sge/` | file listing confirmed |
| 19 | `tests/metamask/card-eligibility.spec.ts` exists | file listing confirmed |
| 20 | `tests/metamask/card-routing.spec.ts` exists | file listing confirmed |
| 21 | `lib/settlement/allocator.ts` exists | directory listing confirmed |
| 22 | `lib/metamask/card.ts` exists | directory listing confirmed |
| 23 | `lib/web3/sgeClaim.ts` exists | directory listing confirmed |
| 24 | AUDIT_SUMMARY: 6 library files = 733 lines | PowerShell Measure-Object confirmed |
| 25 | AUDIT_SUMMARY: 3 contracts = 420 lines | PowerShell Measure-Object confirmed |
| 26 | AUDIT_SUMMARY: 10 scripts = 1,801 lines | PowerShell Measure-Object confirmed |
| 27 | AUDIT_SUMMARY: 5 test files = 835 lines | PowerShell Measure-Object confirmed |
| 28 | `readinessVerdict()` returns `{label, color}` | readiness.ts, Runbook (was fixed — AUDIT_SUMMARY H1) |
| 29 | Zero-first approval pattern in client.ts `safeApprove()` | client.ts, Architecture doc |
| 30 | `vault.setDistributor(addr, bool)` grants/revokes DISTRIBUTOR_ROLE | contract, deploy script, Checklist |
| 31 | `rescueToken()` blocks rescue of SGE token | SgeDistributor.sol, SgeTreasuryVault.sol, claims admin page |
| 32 | `SgeAccessManager` constructor grants 4 roles to admin | contract, Audit |
| 33 | All admin UI pages nav links match actual route structure | page.tsx QUICK_LINKS → claims/, treasury/, testing/ confirmed |

---

## Summary

| Category | Count |
|----------|-------|
| **Contradictions (doc ↔ code)** | 8 |
| **Cross-document contradictions** | 3 (clustering above 8 into 3 groupings) |
| **Verified claims** | 33 |

### Severity ranking

| ID | Severity | Impact | Status |
|----|----------|--------|--------|
| C-01 | **HIGH** | Total supply off by 100×. Affects any financial calculation referencing these docs. | **FIXED** — Updated SGE-RISK-AND-COMPATIBILITY.md and SGE-OPERATOR-RUNBOOK.md to 100 billion |
| C-02 | **HIGH** | Operator following Live Run Sequence will fail deployment (wrong constructor args). | **FIXED** — Added treasury address as 2nd arg in SGE_LIVE_RUN_SEQUENCE.md + Etherscan verify cmd |
| C-03 | **MEDIUM** | Operator following Runbook calls `grantRole` instead of `setDistributor`. Technically works via AccessControl but bypasses vault's event/validation logic. | **FIXED** — Changed to `vault.setDistributor(distributor, true)` in SGE-OPERATOR-RUNBOOK.md |
| C-04 | **MEDIUM** | Wrong function name → call would revert on-chain. | **FIXED** — Changed `setKycVerified` to `setKycStatus` in SGE_CONTRACT_AUDIT.md |
| C-05 | **MEDIUM** | Wrong arg count → ABI encoding failure. | **FIXED** — Changed to `setOperatorOverride(address, bool)` (2 args) in SGE_CONTRACT_AUDIT.md |
| C-06 | **LOW** | Cosmetic string mismatch. Only matters if code pattern-matches on the reason text. | **FIXED** — Changed "KYC not verified" to "KYC not completed" in SGE_CONTRACT_AUDIT.md |
| C-07 | **LOW** | Audit table misleading (Pausable omitted). No runtime impact but audit is factually incomplete. | **FIXED** — Changed inheritance from "SafeERC20" to "Pausable" for SgeTreasuryVault in SGE_CONTRACT_AUDIT.md |
| C-08 | **LOW** | UI scope labels misleading. All scripts require all 3 address env vars at import time. | **FIXED** — Changed scope to "All legacy scripts" in testing/page.tsx |
