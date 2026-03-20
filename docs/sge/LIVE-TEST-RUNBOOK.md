# SGE Claim — Live Mainnet Test Runbook

> **Contract:** `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`  
> **Network:** Ethereum Mainnet (Chain ID 1)  
> **App Route:** `/operator-testing`

---

## 1. System Status

| Mode | Current | Required for Live Test |
|------|---------|----------------------|
| Demo Mode | `NEXT_PUBLIC_DEMO_MODE=true` (default) | Must be `false` |
| Live Mode | Inactive (until demo OFF) | Active |
| PRIVATE_KEY | Not set (commented out) | Required for CLI scripts |
| Contract Funding | DRAINED (0 SGE) | ≥ 1,000 SGE |
| Wallet Funding | Unknown | ETH + USDC or USDT |

**To activate live mode:** set `NEXT_PUBLIC_DEMO_MODE=false` in `apps/web/.env.local` and restart.

---

## 2. Required Wallets

### Owner Wallet

| Field | Value |
|-------|-------|
| Address | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` |
| Role | Funds SGE into claim contract via `fundSGE()` or direct ERC-20 transfer |
| Needs | Enough SGE to load contract (≥ 1,000) + ETH for gas |

### Claim Contract

| Field | Value |
|-------|-------|
| Address | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` |
| Role | Holds SGE inventory for payouts — users send stablecoin, receive SGE |
| Needs | ≥ 1,000 SGE loaded before live test (funded by owner) |

### Operator Test Wallet

| Field | Value |
|-------|-------|
| Address | Derived from `PRIVATE_KEY` in `.env.local` |
| Role | Signs approval + claim transactions during test |
| Needs | 100+ USDC or 100+ USDT, ≥ 0.02 ETH for gas, correct network, private key set |

### Recipient Wallet (Optional)

Only needed if the flow sends payout to a wallet different from the payer.  
**Current contract sends SGE to `msg.sender` (same wallet).** No separate recipient needed.

---

## 3. Required Assets / Balances

| Entity | Asset | Minimum | Recommended | Note |
|--------|-------|---------|-------------|------|
| Claim Contract | SGE | 1,000 | 2,000 | Loaded via owner wallet |
| Operator Wallet | USDC or USDT | 100 | 110 | At least one stablecoin |
| Operator Wallet | ETH | 0.02 | 0.05 | Gas for approve + claim txns |

---

## 4. Required ENV

Source: `apps/web/.env.local` — template at `apps/web/.env.example`

| Variable | Required | Default / Value | Scope |
|----------|----------|-----------------|-------|
| `MAINNET_RPC_URL` | Yes | `https://eth.llamarpc.com` | CLI + live reads |
| `PRIVATE_KEY` | Yes | **MANUAL INPUT REQUIRED** | CLI scripts only — never exposed to browser |
| `CLAIM_CONTRACT_ADDRESS` | No | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` | Hardcoded fallback |
| `SGE_TOKEN_ADDRESS` | No | `0x40489719E489782959486A04B765E1e93e5B221a` | Hardcoded fallback |
| `USDC_TOKEN_ADDRESS` | No | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Hardcoded fallback |
| `USDT_TOKEN_ADDRESS` | No | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Hardcoded fallback |
| `NEXT_PUBLIC_DEMO_MODE` | Yes | `true` | Must be `false` for live testing |
| `NEXTAUTH_SECRET` | No | — | Auth only — not needed for claim test |
| `NEXTAUTH_URL` | No | `http://localhost:3000` | Auth only |

**Setup:**

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
NEXT_PUBLIC_DEMO_MODE=false
```

> **WARNING:** Setting `DEMO_MODE=false` activates ALL live blockchain calls.
> Only do this when you are ready to test with real funds.

---

## 5. Preflight Command

```bash
npx tsx apps/web/scripts/preflight-claim.ts
```

**Read-only** — no transactions, no gas spent.

### Checks performed

- ENV vars present
- Chain ID = 1 (Mainnet)
- Wallet address resolved from PRIVATE_KEY
- ETH balance ≥ 0.02
- USDC balance ≥ 100 (with 110 margin warning)
- USDT balance ≥ 100 (with 110 margin warning)
- USDC/USDT allowances to claim contract
- `CLAIM_AMOUNT()` = 1000 × 10¹⁸
- `hasClaimed(wallet)` = false
- Contract SGE balance ≥ 1,000 (with 2,000 recommended warning)
- Contract owner address

| Exit Code | Meaning |
|-----------|---------|
| `0` | **READY** — all critical checks pass |
| `1` | **BLOCKED** — at least one critical blocker |

---

## 6. Live Test Commands

### USDC Claim

```bash
npx tsx apps/web/scripts/test-live-claim.ts --token=usdc
```

### USDT Claim

```bash
npx tsx apps/web/scripts/test-live-claim.ts --token=usdt
```

> **WARNING:** These commands spend **real tokens on mainnet**. Each call costs 100 USDC/USDT + gas. Run preflight first.

---

## 7. Expected Transaction Flow

1. Load env vars from `apps/web/.env.local`
2. Connect wallet via `PRIVATE_KEY` → derive address
3. Read readiness: chain, balances, contract SGE, `hasClaimed`
4. Abort if any critical check fails
5. Record before-balances (ETH, stablecoin, SGE)
6. Check ERC-20 allowance for selected token
7. For USDT: if existing allowance > 0, reset to 0 first (zero-first pattern)
8. Approve stablecoin spend (100e6) to claim contract
9. Execute `claimWithUSDC()` or `claimWithUSDT()`
10. Wait for transaction receipt
11. Record after-balances and compute deltas
12. Print PASS/FAIL verdict

---

## 8. Pass / Fail Verification

A real **PASS** means all of the following:

- [x] Claim tx hash is present and confirmed on-chain
- [x] Operator stablecoin balance reduced by ≥ 100
- [x] Operator SGE balance increased by ≥ 1,000
- [x] Contract SGE balance reduced by 1,000
- [x] `hasClaimed(wallet)` returns `true`
- [x] No blocked state or revert occurred

### Post-test Etherscan verification

1. Check operator wallet — look for incoming SGE transfer
2. Check claim contract — verify `hasClaimed(wallet)` = `true`
3. Check contract SGE balance decreased by 1,000

---

## 9. Known Failure Modes

| Blocker | Cause | Fix |
|---------|-------|-----|
| Contract drained | 0 SGE in contract | Owner must call `fundSGE()` or transfer SGE |
| Insufficient ETH | < 0.02 ETH in wallet | Fund wallet with ETH |
| Insufficient USDC/USDT | < 100 USDC and < 100 USDT | Fund wallet with stablecoin |
| Missing PRIVATE_KEY | Not set in `.env.local` | Add `PRIVATE_KEY=0x...` |
| Demo mode enabled | `NEXT_PUBLIC_DEMO_MODE=true` | Set to `false` |
| Wrong chain / RPC | Chain ID ≠ 1 | Set `MAINNET_RPC_URL` to mainnet endpoint |
| Token allowance failure | USDT non-zero allowance | Script handles zero-first pattern automatically |
| Contract revert | Various on-chain reasons | Check preflight output for details |
| Already claimed | Wallet already claimed | Use a different wallet |
| No wallet connected | Browser: MetaMask not connected | Connect wallet in browser |

---

## 10. Operator Checklist

- [ ] Set `PRIVATE_KEY` in `apps/web/.env.local`
- [ ] Set `NEXT_PUBLIC_DEMO_MODE=false`
- [ ] Fund claim contract with ≥ 1,000 SGE
- [ ] Fund operator wallet with ≥ 0.02 ETH
- [ ] Fund operator wallet with ≥ 100 USDC or USDT
- [ ] Run preflight: `npx tsx apps/web/scripts/preflight-claim.ts`
- [ ] Confirm preflight returns **READY**
- [ ] Run USDC claim: `npx tsx apps/web/scripts/test-live-claim.ts --token=usdc`
- [ ] Verify balances changed correctly
- [ ] Run USDT claim: `npx tsx apps/web/scripts/test-live-claim.ts --token=usdt`
- [ ] Verify balances changed correctly
- [ ] Record tx hashes and screenshots

---

## Contract Reference

| Entity | Address |
|--------|---------|
| Claim Contract | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` |
| SGE Token | `0x40489719E489782959486A04B765E1e93e5B221a` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| Owner | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` |
| Chain | Ethereum Mainnet (ID 1) |
| Explorer | https://etherscan.io |

---

## Fund the Contract (Owner Only)

The contract owner (`0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7`) must fund before testing:

**Option A — via `fundSGE()`:**

1. Approve the claim contract to spend SGE tokens
2. Call `fundSGE(amount)` where amount = SGE in wei (e.g. `2000000000000000000000` for 2,000 SGE)

**Option B — direct ERC-20 transfer:**

1. Transfer SGE tokens directly to `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`

**Verify contract balance:**

```bash
cast call 0x40489719E489782959486A04B765E1e93e5B221a \
  "balanceOf(address)(uint256)" \
  0x4BFeF695a5f85a65E1Aa6015439f317494477D09 \
  --rpc-url $MAINNET_RPC_URL
```

---

## Current Blockers

The repo is **code-complete** for a live claim test. The only blockers are **chain state**:

- [ ] Contract must be funded with ≥ 1,000 SGE (preferably 2,000)
- [ ] Wallet must hold ≥ 100 USDC or USDT + 0.02 ETH
- [ ] `PRIVATE_KEY` must be set in `apps/web/.env.local`
- [ ] `NEXT_PUBLIC_DEMO_MODE` must be set to `false`

Once all four are satisfied, `preflight-claim.ts` returns exit code 0 and `test-live-claim.ts` executes the claim.
