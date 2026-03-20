# SGE Operator Runbook — Legacy Infrastructure

> Step-by-step operational procedures for deploying, funding, operating, and monitoring the SGE legacy integration system.

## Prerequisites

- Ethereum Mainnet wallet with ≥ 0.1 ETH for gas
- Access to `PRIVATE_KEY` for the deployer wallet
- `MAINNET_RPC_URL` configured (Alchemy/Infura)
- Node.js 18+, `ts-node` available
- SGE tokens available in funder wallet (check via Etherscan)

---

## 1. Pre-Deployment Verification

Run the preflight script before ANY mainnet operation:

```bash
npx ts-node apps/web/scripts/preflight-sge-legacy.ts
```

**Expected output**: All checks PASS or SKIP (no FAIL).  
**If any check FAILs**: Do NOT proceed. Fix the underlying issue first.

### What Preflight Checks

| Check | What It Verifies |
|-------|------------------|
| RPC connectivity | Can reach Ethereum Mainnet |
| Chain ID | Connected to chain 1 (not testnet) |
| SGE token | Contract exists, returns expected name/symbol/decimals |
| Total supply | Matches known value (100 billion SGE) |
| Deployer ETH | Sufficient gas for deployment |
| Distributor (if deployed) | Contract exists, SGE address matches, roles correct |
| Vault (if deployed) | Contract exists, SGE address matches |
| Access Manager (if deployed) | Contract exists, admin role correct |

---

## 2. Contract Deployment

### 2.1 Deploy All Three Contracts

```bash
npx ts-node apps/web/scripts/deploy-sge-distributor.ts
```

**This deploys, in order:**
1. `SgeAccessManager(admin)` — compliance gate
2. `SgeTreasuryVault(sgeToken, admin)` — secure custody
3. `SgeDistributor(sgeToken, vault, claimAmount, admin)` — distribution logic

**Then links:**
4. `vault.setDistributor(distributor, true)`

### 2.2 Post-Deployment

The script outputs:
- Contract addresses (save these immediately)
- Env var instructions (copy into `.env`)
- Deployment manifest JSON

**Critical**: Update `.env` with the three new addresses:
```
SGE_DISTRIBUTOR_ADDRESS=0x...
SGE_TREASURY_ADDRESS=0x...
SGE_ACCESS_MANAGER_ADDRESS=0x...
```

### 2.3 Verify

Run preflight again to confirm all three contracts are live:
```bash
npx ts-node apps/web/scripts/preflight-sge-legacy.ts
```

---

## 3. Funding

### 3.1 Fund the Distributor

```bash
SGE_FUND_AMOUNT=10000 SGE_FUND_TARGET=distributor \
  npx ts-node apps/web/scripts/fund-sge-inventory.ts
```

**What happens:**
1. Checks funder wallet balance
2. Approves Distributor to spend `FUND_AMOUNT` SGE (zero-first pattern)
3. Calls `distributor.fundInventory(amount)`
4. Verifies inventory balance increased

### 3.2 Fund the Vault (Optional)

```bash
SGE_FUND_AMOUNT=50000 SGE_FUND_TARGET=vault \
  npx ts-node apps/web/scripts/fund-sge-inventory.ts
```

### 3.3 Verify Balances

```bash
npx ts-node apps/web/scripts/inspect-sge-system.ts
```

Check the "Balances" section shows expected amounts.

---

## 4. Executing a Claim

### 4.1 Dry Run (Default)

```bash
npx ts-node apps/web/scripts/test-sge-claim.ts
```

**DRY_RUN=true by default**. This checks:
- Caller eligibility
- Gas estimation
- Balance simulation

### 4.2 Live Claim

```bash
DRY_RUN=false npx ts-node apps/web/scripts/test-sge-claim.ts
```

**What happens:**
1. Pre-claim diagnostics (balance, eligibility, gas)
2. Calls `distributor.claimExact()`
3. Waits for confirmation
4. Post-claim verification (balance change, hasClaimed flag)

### 4.3 Post-Claim Capture

Record the following proof data:
- Transaction hash
- Block number
- Gas used
- Pre-claim and post-claim SGE balance of claimant
- Distributor inventory balance change

---

## 5. System Inspection

### Full Snapshot

```bash
npx ts-node apps/web/scripts/inspect-sge-system.ts
```

**Output includes:**
- All contract addresses
- Token metadata (name, symbol, decimals, totalSupply)
- Balances (distributor, vault, admin, operator)
- Role assignments (who has ADMIN, OPERATOR, DISTRIBUTOR, COMPLIANCE)
- Pause states
- Claim configuration (amount, total distributed)
- Access manager settings (allowlist/denylist/KYC/jurisdiction config)

---

## 6. Emergency Procedures

### 6.1 Pause All Operations

```
distributor.pause()   // Stops all claims and distributions
vault.pause()         // Stops all deposits and releases
```

### 6.2 Drain Distributor to Vault

```
distributor.drainToTreasury()  // Moves all SGE from distributor → vault
```

### 6.3 Emergency Vault Withdrawal

```
vault.emergencyWithdraw(recipientAddress)  // Moves all SGE to safe address
```

### 6.4 Rescue Non-SGE Tokens

If other tokens are accidentally sent to contracts:
```
distributor.rescueToken(tokenAddress, recipientAddress, amount)
vault.rescueToken(tokenAddress, recipientAddress, amount)
```

---

## 7. Monitoring Checklist

Run daily or before any operation:

| Check | Tool | Expected |
|-------|------|----------|
| Distributor inventory | inspect script | > 0 SGE |
| Vault balance | inspect script | Expected reserve |
| Pause states | inspect script | `paused: false` |
| Admin role holder | inspect script | Known admin address |
| Operator role holder | inspect script | Known operator address |
| Deployer ETH balance | preflight script | > 0.01 ETH for future ops |
| RPC connectivity | preflight script | PASS |

---

## 8. Readiness API

For programmatic readiness checks (e.g. before UI renders):

```typescript
import { checkLegacyReadiness, readinessVerdict } from "@/lib/sge-legacy";

const result = await checkLegacyReadiness({
  rpcUrl: process.env.MAINNET_RPC_URL!,
  distributorAddress: process.env.SGE_DISTRIBUTOR_ADDRESS,
  treasuryAddress: process.env.SGE_TREASURY_ADDRESS,
  accessManagerAddress: process.env.SGE_ACCESS_MANAGER_ADDRESS,
});

console.log("Verdict:", readinessVerdict(result));
// { label: "BLOCKED" | "READY (with warnings)" | "READY", color: "red" | "amber" | "emerald" }
```

---

## 9. Key Addresses

| Entity | Address | Notes |
|--------|---------|-------|
| SGE Token | `0x40489719E489782959486A04B765E1e93e5B221a` | Immutable, NOT standard ERC-20 |
| Original Claim | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` | Drained (0 SGE) |
| Owner | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` | Legacy claim contract owner |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6 decimals |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6 decimals |
| SgeDistributor | TBD (after deploy) | Set in `.env` |
| SgeTreasuryVault | TBD (after deploy) | Set in `.env` |
| SgeAccessManager | TBD (after deploy) | Set in `.env` |
