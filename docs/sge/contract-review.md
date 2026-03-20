# SGE Claim Contract — Verification & Review

> **Contract Address:** `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`
> **Network:** Ethereum Mainnet (Chain ID 1)
> **Etherscan:** <https://etherscan.io/address/0x4BFeF695a5f85a65E1Aa6015439f317494477D09>

---

## ⚠️ VERIFICATION STATUS

> **The contract is NOT verified on Etherscan.**
> No source code or official ABI is publicly available.
> All function signatures below were confirmed via runtime `eth_call` probing
> and bytecode PUSH4 selector extraction. See [`TRUTH-PASS.md`](./TRUTH-PASS.md) for evidence.

> **CONTRACT IS CURRENTLY DRAINED — 0 SGE balance.**
> Both `claimWithUSDC()` and `claimWithUSDT()` revert with `"Not enough SGE"`.
> The owner must call `fundSGE()` to reload before claims can proceed.

---

## Contract Origin

| Field             | Value                                        |
| ----------------- | -------------------------------------------- |
| Creator           | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7`|
| Creation Tx       | `0x3ca3b72f52466c19c8c896c932af441fef5a2f0f4455aa92d42f264524883c50` |
| Block             | 23149816                                     |
| Total Transactions| 3 (excludes creation; all from same day)     |
| Current Balance   | 0 ETH, 0 SGE                                |

---

## Compiler & Build

| Field             | Value                                   |
| ----------------- | --------------------------------------- |
| Solidity version  | Unknown — contract NOT verified         |
| EVM target        | Unknown                                 |
| Optimization      | Unknown                                 |
| License           | Unknown                                 |

> Bytecode metadata suffix `0x4300081e` suggests Solidity ^0.8.30, but this is unconfirmed.

---

## Confirmed State Variables

| Getter Function     | Selector     | On-Chain Value                             |
| ------------------- | ------------ | ------------------------------------------ |
| `owner()`           | `0x8da5cb5b` | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` |
| `usdcToken()`       | `0x11eac855` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC) |
| `usdtToken()`       | `0xa98ad46c` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` (USDT) |
| `sgeToken()`        | `0x3ab2fa02` | `0x40489719E489782959486A04B765E1e93e5B221a` |
| `CLAIM_AMOUNT()`    | `0x270ef385` | 1000 × 10¹⁸ (SGE reward per claim)         |
| `hasClaimed(addr)`  | `0x73b2e80e` | Returns `true` for deployer                |

---

## Confirmed Constant in Bytecode

| Constant       | Value         | Meaning                        |
| -------------- | ------------- | ------------------------------ |
| `0x05f5e100`   | 100,000,000   | 100 USDC/USDT (6-decimal raw)  |

---

## Supported Payment Tokens

| Token | Address                                      | Decimals | Confirmed |
| ----- | -------------------------------------------- | -------- | --------- |
| USDC  | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | 6        | ✅ via `usdcToken()` |
| USDT  | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | 6        | ✅ via `usdtToken()` |

---

## Claim Functions (CONFIRMED)

| Function         | Selector     | Parameters | Status                    |
| ---------------- | ------------ | ---------- | ------------------------- |
| `claimWithUSDC()`| `0xf9d6d8b6` | none       | ✅ Confirmed (reverts: "Not enough SGE") |
| `claimWithUSDT()`| `0x84910e5c` | none       | ✅ Confirmed (reverts: "Not enough SGE") |

**No generic `claimSGE()` function exists on this contract.**

---

## One-Wallet-One-Claim Logic

Confirmed via `hasClaimed(address)` (`0x73b2e80e`):
- Returns `true` (1) for the deployer address — deployer has claimed.
- Returns `false` (0) for unclaimed addresses.

---

## Admin / Owner Functions (CONFIRMED in bytecode)

| Function                     | Selector     | Purpose                     |
| ---------------------------- | ------------ | --------------------------- |
| `fundSGE(uint256)`           | `0x43b8c825` | Load SGE tokens into contract |
| `renounceOwnership()`        | `0x715018a6` | Ownable — give up ownership |
| `transferOwnership(address)` | `0xf2fde38b` | Ownable — transfer ownership|

**Functions that DO NOT exist on this contract:**
- ~~`pause()` / `unpause()`~~ — No Pausable pattern
- ~~`setClaimAmount()`~~ — Claim amount appears to be immutable
- ~~`setSgeReward()`~~ — Not found
- ~~`setTreasury()`~~ — Not found
- ~~`withdrawTokens()`~~ — Not found

---

## Unidentified Selectors in Bytecode

| Selector     | Responds To eth_call | Notes                        |
| ------------ | -------------------- | ---------------------------- |
| `0x8bd8669e` | Reverts              | Likely owner-only function   |
| `0x9bc5c509` | Reverts              | Likely owner-only function   |
| `0xc426d331` | Reverts              | Likely owner-only function   |
| `0xe2aa4b4c` | Returns 100 × 10⁶   | Stablecoin price getter (name unknown) |
| `0x69706965` | N/A                  | ASCII "ipie" — string data   |
| `0x6c61696d` | N/A                  | ASCII "laim" — string data   |
| `0x4300081e` | N/A                  | Compiler metadata (Solidity ^0.8.30) |

---

## Event Signature

### UNVERIFIED

The event `Claimed` is assumed to be:
```
Claimed(address indexed wallet, address token, uint256 amount, uint256 sgeAmount)
```
**This has NOT been confirmed** — the two claim transactions in the contract history
would need their receipt logs decoded to verify the exact event signature and indexing.

---

## Transaction History

| # | Tx Hash (prefix) | Method              | Caller      | Notes                     |
| - | ----------------- | ------------------- | ----------- | ------------------------- |
| 1 | `0x3ca3b72f...`   | Contract Creation   | Deployer    | Block 23149816            |
| 2 | `0x9ece9668...`   | `claimWithUSDT()`   | Deployer    | First claim               |
| 3 | `0xa2948c3a...`   | `claimWithUSDC()`   | `0x941d...` | Second claim              |
| 4 | `0xf42bec0e...`   | "Transfer All Tok…" | Deployer    | SGE tokens drained        |

---

## Failure Cases / Revert Reasons

| Condition                     | Confirmed Revert Reason              |
| ----------------------------- | ------------------------------------ |
| Contract has no SGE balance   | `"Not enough SGE"` ✅ confirmed      |
| Wallet already claimed        | `"Already claimed"` (assumed)        |
| Insufficient USDC/USDT balance| ERC-20 transfer reverts (assumed)    |
| Insufficient allowance        | ERC-20 transferFrom reverts (assumed)|

---

## Security Observations

1. **No Pausable:** The contract cannot be paused by the owner. There is no circuit breaker.
2. **USDT approval quirk:** USDT requires setting allowance to 0 before setting a new non-zero value. The frontend must handle this.
3. **Immutable pricing:** The stablecoin cost (100) and SGE reward (1000) appear to be constants, not configurable state variables.
4. **Token decimals:** USDC and USDT use 6 decimals. SGE appears to use 18 decimals (based on `CLAIM_AMOUNT()` = 10²¹).
5. **Front-running:** Claims are per-wallet, so front-running is limited to gas competition.
6. **Drained state:** The contract currently has no SGE to distribute. Attempts to claim will revert.

---

## Appendix: Raw ABI Location

See [`/docs/sge/abi.json`](./abi.json) for the machine-readable ABI (verified selectors only).
See [`/docs/sge/TRUTH-PASS.md`](./TRUTH-PASS.md) for full runtime truth pass evidence.

---

## Live Etherscan Verification (2025-01-18)

### SGE Claim Contract (`0x4BFeF695…477D09`)
- **ETH Balance:** 0 ETH
- **SGE Balance:** 0 (drained)
- **Verified on Etherscan:** No (bytecode only)
- **Creator:** `0x9FfE2F6f…C43a39Cb7` — created ~216 days ago
- **External Transactions:** 3 total (Etherscan confirms "Latest 3 from a total of 3")

### SGE Token (`0x40489719…e5B221a`)
- **Max Total Supply:** 100,000,000,000 SGE
- **Decimals:** 18
- **Holders:** 21,210
- **Total Transfers:** 22,582
- **Token Reputation:** UNKNOWN (Etherscan warning)
- **Status:** Active, real token with broad distribution

### SGE Token Flow Through Claim Contract
| Block      | Direction | Method               | Counterparty         | SGE Amount |
| ---------- | --------- | -------------------- | -------------------- | ---------- |
| 23,149,827 | IN        | ERC-20 `transfer()`  | Owner → Contract     | +3,000     |
| 23,149,961 | OUT       | `claimWithUSDT()`    | Contract → Owner     | −1,000     |
| 23,150,036 | OUT       | `claimWithUSDC()`    | Contract → `0x941d…` | −1,000     |
| 23,150,063 | OUT       | Transfer All Tokens  | Contract → Owner     | −1,000     |
| —          | —         | —                    | Net balance          | **= 0**    |

> Contract was funded via direct ERC-20 transfer, NOT via `fundSGE()`.
> Both `claimWithUSDC()` and `claimWithUSDT()` executed successfully on mainnet.
> Remaining 1,000 SGE drained via an unidentified owner function ("Transfer All Tokens").

### Target Wallet (`0x1FF7251B…d89AD314E47…`)
- **ETH Balance:** 0 ETH
- **Token Balances:** None
- **Transactions Sent:** N/A (never used)
- **Funded By:** N/A
- **Status:** Virgin wallet — never had any on-chain activity

### Implications
1. The contract **works correctly** — both claim functions executed and distributed SGE.
2. The contract is **currently non-functional** — 0 SGE balance means all claims revert.
3. To re-enable claims, the owner must either call `fundSGE()` or transfer SGE directly.
4. The target wallet has never been used for settlements.
