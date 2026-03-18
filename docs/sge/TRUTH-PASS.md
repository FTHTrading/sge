# SGE Claim Contract — Runtime Truth Pass

> **Date:** 2025-03-17
> **Method:** Direct on-chain `eth_call` probing via public RPC (`eth.llamarpc.com`)
> **Contract:** `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` (Ethereum Mainnet)

---

## Executive Summary

The contract is **NOT verified** on Etherscan. No source code or official ABI is publicly available.
All function names were confirmed by computing 4-byte selectors from candidate signatures and
matching them against (a) bytecode PUSH4 opcodes and (b) live `eth_call` responses.

### What Is Real

| Function / State          | Selector     | On-Chain Response                       | Status          |
| ------------------------- | ------------ | --------------------------------------- | --------------- |
| `owner()`                 | `0x8da5cb5b` | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` (deployer) | ✅ CONFIRMED |
| `usdcToken()`             | `0x11eac855` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC) | ✅ CONFIRMED |
| `usdtToken()`             | `0xa98ad46c` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` (USDT) | ✅ CONFIRMED |
| `sgeToken()`              | `0x3ab2fa02` | `0x40489719E489782959486A04B765E1e93e5B221a` | ✅ CONFIRMED |
| `hasClaimed(address)`     | `0x73b2e80e` | Returns `true` for deployer address     | ✅ CONFIRMED |
| `claimWithUSDC()`         | `0xf9d6d8b6` | Reverts "Not enough SGE" (contract drained) | ✅ CONFIRMED |
| `claimWithUSDT()`         | `0x84910e5c` | Reverts "Not enough SGE" (contract drained) | ✅ CONFIRMED |
| `CLAIM_AMOUNT()` (const)  | `0x270ef385` | `0x3635c9adc5dea00000` = 1000 × 10¹⁸   | ✅ CONFIRMED |
| Unknown getter (price)    | `0xe2aa4b4c` | `0x5f5e100` = 100 × 10⁶                | ✅ CONFIRMED |
| `renounceOwnership()`     | `0x715018a6` | Present in bytecode (Ownable)           | ✅ CONFIRMED |
| `transferOwnership(addr)` | `0xf2fde38b` | Present in bytecode (Ownable)           | ✅ CONFIRMED |
| `fundSGE(uint256)`        | `0x43b8c825` | Reverts (likely onlyOwner)              | ✅ CONFIRMED |

### What Is NOT On-Chain

| Our Assumed Function  | Selector We Used | Real On-Chain |
| --------------------- | ---------------- | ------------- |
| `paused()`            | `0x5c975abb`     | ❌ REVERTS — function does NOT exist |
| `claimAmount()`       | `0xe4a30116`     | ❌ REVERTS — wrong name. Real name is `CLAIM_AMOUNT()` |
| `sgeReward()`         | `0x7be951b0`     | ❌ REVERTS — function does NOT exist |
| `treasury()`          | `0x61d027b3`     | ❌ REVERTS — function does NOT exist |
| `claimSGE()`          | computed         | ❌ NOT in bytecode selectors |
| `pause()` / `unpause()` | computed       | ❌ NOT in bytecode selectors |
| `setClaimAmount()`    | computed         | ❌ NOT in bytecode selectors |
| `setSgeReward()`      | computed         | ❌ NOT in bytecode selectors |
| `setTreasury()`       | computed         | ❌ NOT in bytecode selectors |
| `withdrawTokens()`    | computed         | ❌ NOT in bytecode selectors |

---

## Bytecode Selector Analysis

23 PUSH4 instructions extracted from runtime bytecode:

| Selector     | Identification                                   |
| ------------ | ------------------------------------------------ |
| `0x05f5e100` | **Constant:** 100,000,000 (100 USDC/USDT raw)   |
| `0x11eac855` | `usdcToken()`                                    |
| `0x23b872dd` | `transferFrom(address,address,uint256)` [ERC-20] |
| `0x270ef385` | `CLAIM_AMOUNT()` — returns 1000 × 10¹⁸          |
| `0x3ab2fa02` | `sgeToken()`                                     |
| `0x4300081e` | Unknown — possibly Solidity compiler metadata    |
| `0x43b8c825` | `fundSGE(uint256)` — owner can load SGE          |
| `0x69706965` | Unknown — ASCII "ipie", possibly string data     |
| `0x6c61696d` | Unknown — ASCII "laim", likely string literal    |
| `0x70a08231` | `balanceOf(address)` [ERC-20]                    |
| `0x715018a6` | `renounceOwnership()` [Ownable]                  |
| `0x73b2e80e` | `hasClaimed(address)`                            |
| `0x84910e5c` | `claimWithUSDT()`                                |
| `0x8bd8669e` | Unknown — reverts on call                        |
| `0x8da5cb5b` | `owner()` [Ownable]                              |
| `0x9bc5c509` | Unknown — reverts on call                        |
| `0xa9059cbb` | `transfer(address,uint256)` [ERC-20]             |
| `0xa98ad46c` | `usdtToken()`                                    |
| `0xc426d331` | Unknown — reverts on call                        |
| `0xe2aa4b4c` | Unknown getter — returns 100 × 10⁶ (price)      |
| `0xf2fde38b` | `transferOwnership(address)` [Ownable]           |
| `0xf9d6d8b6` | `claimWithUSDC()`                                |
| `0xffffffff` | Mask/sentinel constant                           |

---

## Transaction History

Only **4 transactions** total, all from the same day (~213 days ago):

1. **Contract Creation** by `0x9FfE...9Cb7`
2. **`claimWithUSDT()`** (`0x84910e5c`) — called by deployer
3. **`claimWithUSDC()`** (`0xf9d6d8b6`) — called by `0x941d683F...`
4. **"Transfer All Tok..."** — deployer drained remaining SGE tokens

**Current state:** Contract holds 0 ETH, 0 SGE. Both claim functions revert with "Not enough SGE".

---

## Critical Mismatch Log

### 1. `CLAIM_AMOUNT()` vs `claimAmount()`

**Our code:** `contract.claimAmount()` → selector `0xe4a30116`
**Real contract:** `CLAIM_AMOUNT()` → selector `0x270ef385`

The contract uses SCREAMING_CASE for this public constant. Our camelCase call always reverts.
**The value it returns is 1000 × 10¹⁸ — this is the SGE reward, NOT the stablecoin price.**

### 2. No `sgeReward()` function — the SGE amount IS `CLAIM_AMOUNT()`

The contract does NOT have a separate `sgeReward()` getter. Based on the name and value:
- `CLAIM_AMOUNT()` = 1000 SGE (the reward the user receives)
- `0xe2aa4b4c` = 100 × 10⁶ (the stablecoin payment, hardcoded as a constant)

### 3. No `paused()` function

The contract does NOT implement OpenZeppelin Pausable. There is no `pause()`, `unpause()`, or `paused()` function in the bytecode. Our `isPaused()` wrapper will always revert.

### 4. No `treasury()` function

The contract does NOT expose a public `treasury()` getter. Treasury handling is internal.

### 5. No `claimSGE()` function

Our ABI includes `claimSGE()` as a generic claim alias. This function does NOT exist in the bytecode.

### 6. No admin setter functions

`setClaimAmount()`, `setSgeReward()`, `setTreasury()`, `withdrawTokens()` — **none** of these exist.
The only admin-callable functions are:
- `fundSGE(uint256)` — load SGE tokens into the contract
- `renounceOwnership()` — give up ownership
- `transferOwnership(address)` — transfer ownership
- 3 unknown functions (`0x8bd8669e`, `0x9bc5c509`, `0xc426d331`) that revert on non-owner calls

### 7. `sgeToken()` address was unknown

The real SGE token is `0x40489719E489782959486A04B765E1e93e5B221a`.
Our config had no SGE token address at all.

### 8. `usdtToken()` selector was wrong

We used selector `0x3b9cf2cf` for `usdtToken()`. The real selector from bytecode is `0xa98ad46c`.
This means there are two different function names that both relate to USDT — the real getter has a
different function signature than we assumed.

### 9. Event signature unverified

We assumed: `Claimed(address indexed wallet, address token, uint256 amount, uint256 sgeAmount)`
The reconciliation engine uses: `Claimed(address indexed claimer, address indexed token, uint256 amount)`
Neither can be confirmed without verified source or actual event logs from the 2 claim transactions.

---

## What DOES Work in Our Code

| Component                  | Verdict    | Notes                                          |
| -------------------------- | ---------- | ---------------------------------------------- |
| Contract address           | ✅ Correct | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`   |
| Chain ID                   | ✅ Correct | Ethereum Mainnet (1)                           |
| USDC address               | ✅ Correct | Matches on-chain `usdcToken()` return          |
| USDT address               | ✅ Correct | Matches on-chain `usdtToken()` return          |
| `owner()` call             | ✅ Correct | Returns deployer address                       |
| `hasClaimed(address)` call | ✅ Correct | Selector `0x73b2e80e` works, returns bool      |
| `claimWithUSDC()` sig      | ✅ Correct | Parameterless, selector matches                |
| `claimWithUSDT()` sig      | ✅ Correct | Parameterless, selector matches                |
| Payment = 100 USDC/USDT    | ✅ Correct | Constant `0x05f5e100` = 100 × 10⁶ in bytecode |
| Reward = 1000 SGE           | ✅ Correct | `CLAIM_AMOUNT()` returns 1000 × 10¹⁸          |
| Claim amount config         | ✅ Correct | `claimAmountRaw: "100000000"` matches          |
| `sgeReward: 1000`           | ✅ Correct | Matches on-chain value                         |
| Wallet / connect / switch   | ✅ Correct | Standard MetaMask integration                  |
| Settlement flow design      | ✅ Correct | Correctly describes sequenced (not atomic)     |
| Reconciliation logic        | ✅ Correct | Idempotent design is sound                     |

---

## Current Contract Status: DRAINED

The contract currently holds **0 SGE tokens**. Both `claimWithUSDC()` and `claimWithUSDT()`
revert with `"Not enough SGE"`. The deployer's 4th transaction ("Transfer All Tok...") moved
all SGE out of the contract.

**Implication:** Live claims are impossible until the owner calls `fundSGE()` to reload the contract.

---

## Corrective Actions Required

1. **Remove** `claimSGE()`, `paused()`, `sgeReward()`, `treasury()`, `claimAmount()` from ABI
2. **Add** `CLAIM_AMOUNT()`, `sgeToken()` (correct selector), `usdtToken()` (correct selector), `fundSGE(uint256)`
3. **Remove** admin functions that don't exist: `pause/unpause`, `setClaimAmount`, `setSgeReward`, `setTreasury`, `withdrawTokens`
4. **Add** SGE token address `0x40489719E489782959486A04B765E1e93e5B221a` to config
5. **Remove** `isPaused()` wrapper from sgeClaim.ts 
6. **Remove** `readClaimAmount()` and `readSgeReward()` or rewrite to use correct selectors
7. **Remove** `readTreasury()` wrapper
8. **Update** `contract-review.md` with all confirmed findings
9. **Audit** event signature — mark as UNVERIFIED until a real claim event log is decoded
10. **Add** contract status banner: DRAINED / NOT ACCEPTING CLAIMS
