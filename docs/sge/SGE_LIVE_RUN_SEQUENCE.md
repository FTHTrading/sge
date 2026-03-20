# SGE Live Run Sequence

> Exact ordered steps to deploy the SGE legacy integration and execute the first mainnet claim.  
> Each step references the specific script, command, or manual action required.

---

## Prerequisites

Before beginning, ensure:

- [ ] Node.js ≥ 18, pnpm installed
- [ ] `pnpm install` completed successfully
- [ ] Hardhat or Foundry installed and configured
- [ ] Contracts compiled (`npx hardhat compile` or `forge build`)
- [ ] Artifacts exist in `artifacts/` or `out/`
- [ ] `.env` file populated with at minimum: `MAINNET_RPC_URL`, `PRIVATE_KEY`
- [ ] Deployer wallet funded with ≥ 0.1 ETH (gas for 3 deployments + linking)
- [ ] Deployer wallet holds or has access to SGE tokens for funding
- [ ] 127/127 tests passing (`npx vitest run`)
- [ ] 0 TypeScript errors (`cd apps/web && npx tsc --noEmit`)

---

## Phase 1: Pre-Deployment Verification

### Step 1.1 — Run preflight check

```bash
cd apps/web
npx ts-node scripts/preflight-sge-legacy.ts
```

**Expected output:**
- ✅ RPC connected (Chain ID: 1)
- ✅ SGE token found at `0x40489719E489782959486A04B765E1e93e5B221a`
- ✅ Token name: "Scalable Green Energy", symbol: SGE, decimals: 18
- ⚠️ Distributor: not deployed (expected — addresses not set yet)
- ⚠️ Vault: not deployed
- ⚠️ AccessManager: not deployed

**Abort if:** RPC fails, token not found, wrong chain ID.

### Step 1.2 — Verify deployer balance

```bash
# In a Node REPL or add to preflight output
cast balance <DEPLOYER_ADDRESS> --rpc-url $MAINNET_RPC_URL
```

**Minimum:** 0.1 ETH for all deployments. 0.2 ETH recommended.

### Step 1.3 — Verify SGE token balance

Confirm the deployer (or a funding wallet) holds enough SGE to fund the distributor.

---

## Phase 2: Contract Deployment

### Step 2.1 — Deploy all 3 contracts

```bash
cd apps/web
npx ts-node scripts/deploy-sge-distributor.ts
```

**What this does (in order):**
1. Deploys `SgeAccessManager` — constructor args: `(adminAddress)`
2. Deploys `SgeTreasuryVault` — constructor args: `(sgeTokenAddress, adminAddress)`
3. Deploys `SgeDistributor` — constructor args: `(sgeTokenAddress, treasuryAddress, claimAmountWei, adminAddress)`
4. Calls `vault.setDistributor(distributorAddress, true)` — links vault to distributor
5. Grants `OPERATOR_ROLE` on distributor to operator address

**Expected output:**
```
AccessManager deployed to: 0x...
TreasuryVault deployed to: 0x...
Distributor deployed to: 0x...
Vault linked to Distributor ✓
Operator role granted ✓
```

### Step 2.2 — Record deployed addresses

**CRITICAL:** Copy the 3 deployed addresses and update `.env`:

```env
SGE_DISTRIBUTOR_ADDRESS=0x...
SGE_TREASURY_ADDRESS=0x...
SGE_ACCESS_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_SGE_TREASURY_ADDRESS=0x...
NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS=0x...
```

### Step 2.3 — Verify on Etherscan

```bash
npx hardhat verify --network mainnet <ACCESS_MANAGER_ADDR> <ADMIN_ADDR>
npx hardhat verify --network mainnet <VAULT_ADDR> <SGE_TOKEN_ADDR> <ADMIN_ADDR>
npx hardhat verify --network mainnet <DISTRIBUTOR_ADDR> <SGE_TOKEN_ADDR> <TREASURY_ADDR> <CLAIM_AMOUNT_WEI> <ADMIN_ADDR>
```

---

## Phase 3: Post-Deployment Verification

### Step 3.1 — Re-run preflight

```bash
npx ts-node scripts/preflight-sge-legacy.ts
```

**Expected:** All 3 contracts should now show as deployed and linked.

### Step 3.2 — Run full inspection

```bash
npx ts-node scripts/inspect-sge-system.ts
```

**Verify:**
- Distributor: paused=false, claimAmount correct, sgeToken correct, admin/operator roles assigned
- Vault: distributor role granted, SGE balance = 0 (not funded yet)
- AccessManager: admin/compliance/operator roles assigned

---

## Phase 4: Funding

### Step 4.1 — Fund the distributor

```bash
SGE_FUND_TARGET=distributor SGE_FUND_AMOUNT=1000 npx ts-node scripts/fund-sge-inventory.ts
```

**What this does:**
1. Calls `sgeToken.approve(distributorAddress, 0)` — zero-first (race condition safety)
2. Calls `sgeToken.approve(distributorAddress, fundAmount)`
3. Calls `distributor.fundInventory(fundAmount)`
4. Verifies distributor SGE balance increased

**Expected output:**
```
Funding distributor with 1000 SGE...
Approval (zero): confirmed
Approval (amount): confirmed
Fund tx: confirmed
Distributor new balance: 1000.00 SGE ✓
```

**Abort if:** Approval fails, fund tx reverts, balance doesn't match.

### Step 4.2 — (Optional) Fund the vault

```bash
SGE_FUND_TARGET=vault SGE_FUND_AMOUNT=5000 npx ts-node scripts/fund-sge-inventory.ts
```

The vault holds reserve SGE. The distributor holds operational SGE for claims.

### Step 4.3 — Verify funding

```bash
npx ts-node scripts/inspect-sge-system.ts
```

**Check:** Distributor balance = funded amount. Vault balance = vault funded amount (if any).

---

## Phase 5: Dry-Run Claim Test

### Step 5.1 — Execute dry-run claim

```bash
DRY_RUN=true npx ts-node scripts/test-sge-claim.ts
```

**What this does:**
1. Reads `distributor.hasClaimed(callerAddress)` — should be `false`
2. Reads `distributor.claimAmount()` — should match config
3. Simulates `distributor.claimExact.staticCall()` — should succeed
4. Does **NOT** send a transaction

**Expected output:**
```
DRY RUN MODE — no transactions will be sent
Caller: 0x...
Has claimed: false
Claim amount: 1000.00 SGE
Static call simulation: SUCCESS ✓
Dry run complete. Set DRY_RUN=false to execute.
```

**Abort if:** Static call reverts, hasClaimed is true, claim amount is wrong.

---

## Phase 6: LIVE Claim Execution

> ⚠️ **IRREVERSIBLE ON MAINNET** — This sends a real transaction.

### Step 6.1 — Final pre-claim checks

| Check | Expected |
|-------|----------|
| Correct chain (ID 1) | ✅ |
| Correct deployer/caller | ✅ |
| Distributor has sufficient SGE | ✅ |
| hasClaimed = false for caller | ✅ |
| Dry run succeeded | ✅ |
| Gas price reasonable | ✅ |

### Step 6.2 — Execute live claim

```bash
DRY_RUN=false npx ts-node scripts/test-sge-claim.ts
```

**What this does:**
1. Calls `distributor.claimExact()` — sends a real mainnet transaction
2. Waits for confirmation (1 block)
3. Reads `distributor.hasClaimed(callerAddress)` — should now be `true`
4. Reads caller's SGE balance — should have increased by claim amount

**Expected output:**
```
LIVE MODE — transactions will be sent on Ethereum Mainnet
Calling claimExact()...
Tx hash: 0x...
Confirmations: 1
Has claimed (post): true ✓
Caller SGE balance: +1000.00 SGE ✓
CLAIM SUCCESSFUL
```

### Step 6.3 — Record proof

Capture and store:
1. Transaction hash
2. Block number
3. Gas used / gas price
4. Caller address
5. SGE balance before / after
6. Etherscan link: `https://etherscan.io/tx/<HASH>`

Use the `/operator-testing` page's "Live Proof Capture" section to record these values.

---

## Phase 7: Post-Claim Verification

### Step 7.1 — Inspect system state

```bash
npx ts-node scripts/inspect-sge-system.ts
```

**Verify:**
- Distributor balance decreased by claim amount
- Caller's `hasClaimed` = true
- No unexpected state changes

### Step 7.2 — Verify on Etherscan

1. Go to `https://etherscan.io/tx/<HASH>`
2. Confirm: Status = Success, To = Distributor, Method = claimExact
3. Check token transfer in "ERC-20 Tokens Transferred" section

### Step 7.3 — Run full readiness check

From the admin UI at `/admin/sge`, or programmatically:

```bash
npx ts-node -e "
  const { checkLegacyReadiness, readinessVerdict } = require('./src/lib/sge-legacy/readiness');
  const { SGE_LEGACY_TOKEN } = require('./src/lib/sge-legacy/config');
  checkLegacyReadiness(SGE_LEGACY_TOKEN).then(r => {
    console.log(readinessVerdict(r));
    console.log(JSON.stringify(r, null, 2));
  });
"
```

---

## Phase 8: Operational Steady-State

After the first successful claim:

### Ongoing operations

| Task | Frequency | Script/Tool |
|------|-----------|-------------|
| Monitor distributor balance | Daily | `inspect-sge-system.ts` |
| Top-up distributor | As needed | `fund-sge-inventory.ts` |
| Check readiness | Before any batch | Readiness checker |
| Review claim history | Weekly | Etherscan + inspect script |

### Emergency procedures

| Scenario | Action |
|----------|--------|
| Distributor compromised | Call `distributor.pause()` then `drainToTreasury()` |
| Wrong token sent to distributor | Call `distributor.rescueToken(tokenAddr, safeAddr, amount)` |
| Vault emergency | Call `vault.emergencyWithdraw(safeAddr)` |
| Need to revoke operator | Call `distributor.revokeRole(OPERATOR_ROLE, addr)` |

---

## Sequence Diagram

```
Operator                    Scripts                     Mainnet
   │                          │                           │
   ├─ preflight ─────────────►│──── read token ──────────►│
   │                          │◄─── token info ───────────│
   │                          │                           │
   ├─ deploy ────────────────►│──── deploy 3 contracts ──►│
   │                          │◄─── addresses ────────────│
   │                          │──── link vault ──────────►│
   │                          │◄─── confirmed ────────────│
   │                          │                           │
   ├─ update .env             │                           │
   │                          │                           │
   ├─ fund ──────────────────►│──── approve + fund ──────►│
   │                          │◄─── confirmed ────────────│
   │                          │                           │
   ├─ dry-run claim ─────────►│──── staticCall ──────────►│
   │                          │◄─── simulation OK ────────│
   │                          │                           │
   ├─ LIVE claim ────────────►│──── claimExact() ────────►│
   │                          │◄─── tx receipt ───────────│
   │                          │                           │
   ├─ inspect ───────────────►│──── read state ──────────►│
   │                          │◄─── full snapshot ────────│
   │                          │                           │
   ▼                          ▼                           ▼
```
