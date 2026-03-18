# SGE Alignment OS — Test Plan

## Scope

This test plan covers the SGE claim workflow, settlement engine, and MetaMask Card readiness module.
Tests are structured as TypeScript spec files designed for a Jest/Vitest runner.

---

## Test Matrix

| Area | File | Coverage |
|------|------|----------|
| Claim flow | `tests/sge/claim.spec.ts` | `runClaimFlow`, wallet connect, eligibility check, step transitions |
| Token allowance | `tests/sge/allowance.spec.ts` | ERC-20 balance, allowance, approval, USDT zero-first pattern |
| Settlement | `tests/sge/settlement.spec.ts` | Allocation math, ledger creation, integrity validation, reconciliation |
| Card eligibility | `tests/metamask/card-eligibility.spec.ts` | `checkCardEligibility`, network detection, region lookup |
| Card routing | `tests/metamask/card-routing.spec.ts` | URL map correctness, deep-link construction |

---

## Environment

- **Framework:** Vitest or Jest with `ts-jest`
- **Mocking:** `vi.mock` / `jest.mock` for ethers dynamic imports
- **No on-chain calls:** All contract reads/writes are mocked; no RPC required
- **BigInt:** Tests use native `BigInt` — Node 16+ required

---

## Conventions

1. Each `describe` block maps to a single public function or flow.
2. `it("should …")` names describe the expected behavior, not the implementation.
3. On-chain calls are mocked at the ethers provider/contract level.
4. Token amounts are always compared as `bigint` strings to avoid precision issues.
5. Allocation tests verify that leg sums equal the input payment exactly.

---

## Running

```bash
# from monorepo root
pnpm --filter web test

# single file
pnpm --filter web test tests/sge/settlement.spec.ts
```

---

## Coverage Targets

| Module | Branches | Statements |
|--------|----------|------------|
| `lib/settlement/allocator.ts` | 100% | 100% |
| `lib/settlement/ledger.ts` | 100% | 100% |
| `lib/settlement/reconcile.ts` | ≥ 90% | ≥ 95% |
| `lib/web3/sgeClaim.ts` | ≥ 80% | ≥ 85% |
| `lib/metamask/card.ts` | 100% | 100% |
