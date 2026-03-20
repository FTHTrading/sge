# SGE Claim Contract — Function Map

> **Contract:** `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`
> **Network:** Ethereum Mainnet
> **Verified on Etherscan:** No (bytecode only)
> **Source of truth:** `docs/sge/TRUTH-PASS.md` — selectors confirmed via keccak256 brute-force against deployed bytecode

---

## Verified Selectors

All selectors below were confirmed by extracting PUSH4 opcodes from deployed bytecode
and matching them against `keccak256(signature)[:4]`. Only these exist on-chain.

### User-Facing (Write)

| Selector     | Function           | Access | Purpose                                                       |
| ------------ | ------------------ | ------ | ------------------------------------------------------------- |
| `0xf9d6d8b6` | `claimWithUSDC()`  | Public | Approve ≥ 100 USDC → contract transfers 1,000 SGE to caller  |
| `0x84910e5c` | `claimWithUSDT()`  | Public | Approve ≥ 100 USDT → contract transfers 1,000 SGE to caller  |

### Read-Only

| Selector     | Function              | Returns   | Purpose                                            |
| ------------ | --------------------- | --------- | -------------------------------------------------- |
| `0x73b2e80e` | `hasClaimed(address)` | `bool`    | Whether a wallet has already claimed                |
| `0x270ef385` | `CLAIM_AMOUNT()`      | `uint256` | SGE reward per claim (returns 1000 × 10¹⁸)        |
| `0x8da5cb5b` | `owner()`             | `address` | Contract owner (Ownable)                           |
| `0x3ab2fa02` | `sgeToken()`          | `address` | SGE token contract stored in state                 |
| `0x11eac855` | `usdcToken()`         | `address` | USDC token contract stored in state                |
| `0xa98ad46c` | `usdtToken()`         | `address` | USDT token contract stored in state                |

### Admin (onlyOwner)

| Selector     | Function                 | Purpose                                   |
| ------------ | ------------------------ | ----------------------------------------- |
| `0x43b8c825` | `fundSGE(uint256)`       | Load SGE tokens into the contract         |
| inherited    | `renounceOwnership()`    | Ownable — give up ownership               |
| inherited    | `transferOwnership(addr)`| Ownable — transfer to new owner           |

> **Note:** A "Transfer All Tokens" drain function was observed in tx
> `0xf42bec0e…` but its selector is unresolved. It may be an unlabeled
> owner-only emergency withdrawal. It is NOT included in the client ABI.

---

## NOT on-chain (phantom functions from prior assumed ABI)

The following were listed in earlier documentation but do **NOT** exist in the
deployed bytecode. They must never appear in any ABI used by the frontend:

- `claimSGE()` — does not exist
- `paused()` / `pause()` / `unpause()` — no pause mechanism
- `claimAmount()` / `sgeReward()` — use `CLAIM_AMOUNT()` instead
- `treasury()` / `setTreasury()` — no treasury getter/setter
- `setClaimAmount()` / `setSgeReward()` — no admin setters
- `withdrawTokens()` — not this selector (drain uses different function)

---

## Events

| Event     | Status      | Notes                                                        |
| --------- | ----------- | ------------------------------------------------------------ |
| `Claimed` | UNVERIFIED  | Assumed signature: `Claimed(address indexed, address, uint256, uint256)`. No decoded logs available because contract is unverified. |

> Paused/Unpaused events do NOT exist — there is no pause mechanism.

---

## Frontend Call Sequence

```
1. checkContractFundedStatus() → if !isFunded, show "Contract not funded"
2. hasClaimed(wallet)          → if true, show "Already claimed"
3. ERC20.allowance(w, c)      → if < 100 × 10⁶, proceed to approve
4. ERC20.approve(c, amt)      → set allowance (USDT: zero-first pattern)
5. claimWithUSDC/USDT()       → execute claim
6. waitForReceipt(txHash)     → confirm on-chain success
```

---

## On-Chain History (as of 2025-01-18)

| Block      | Method              | From           | SGE Movement |
| ---------- | ------------------- | -------------- | ------------ |
| 23,149,827 | ERC-20 `transfer()` | Owner          | +3,000 in    |
| 23,149,961 | `claimWithUSDT()`   | Owner (test)   | −1,000 out   |
| 23,150,036 | `claimWithUSDC()`   | `0x941d…51ca`  | −1,000 out   |
| 23,150,063 | Transfer All Tok…   | Owner (drain)  | −1,000 out   |
| —          | —                   | —              | **= 0 SGE**  |

**Current contract balance: 0 SGE.** Claims will revert until re-funded via `fundSGE()` or direct ERC-20 transfer.
