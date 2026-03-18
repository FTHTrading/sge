# SGE Claim Contract — Function Map

> **Contract:** `0x4BFeF695a5f85a65E1Aa6015439f317494477D09`
> **Network:** Ethereum Mainnet

---

## User-Facing Functions

### `claimWithUSDC()`
- **Access:** Public
- **Requires:** Caller has approved ≥ `claimAmount` USDC to this contract
- **Effect:** Transfers `claimAmount` USDC from caller to treasury; transfers `sgeReward` SGE to caller
- **Reverts if:** Already claimed, paused, insufficient allowance/balance
- **Emits:** `Claimed(wallet, usdcAddress, claimAmount, sgeReward)`

### `claimWithUSDT()`
- **Access:** Public
- **Requires:** Caller has approved ≥ `claimAmount` USDT to this contract
- **Effect:** Same as above but using USDT
- **Reverts if:** Same conditions
- **Emits:** `Claimed(wallet, usdtAddress, claimAmount, sgeReward)`

### `claimSGE()`
- **Access:** Public
- **Purpose:** May be an alias or a different claim path; needs ABI verification
- **Notes:** If contract supports a generic claim, this would auto-detect token. Most likely an alias.

---

## Read-Only Functions

| Function               | Returns   | Purpose                                    |
| ---------------------- | --------- | ------------------------------------------ |
| `hasClaimed(address)`  | `bool`    | Check if wallet has already claimed         |
| `claimAmount()`        | `uint256` | Current stablecoin payment required         |
| `sgeReward()`          | `uint256` | Current SGE tokens distributed per claim    |
| `paused()`             | `bool`    | Whether claims are currently halted         |
| `owner()`              | `address` | Contract owner / admin                      |
| `treasury()`           | `address` | Destination for stablecoin payments         |

---

## Admin Functions (onlyOwner)

| Function                              | Purpose                           |
| ------------------------------------- | --------------------------------- |
| `pause()`                             | Halt all claim operations         |
| `unpause()`                           | Resume claims                     |
| `setClaimAmount(uint256 _amount)`     | Update required stablecoin amount |
| `setSgeReward(uint256 _reward)`       | Update SGE distribution amount    |
| `setTreasury(address _treasury)`      | Change treasury wallet            |
| `withdrawTokens(address, uint256)`    | Emergency token recovery          |

---

## Events

| Event        | Indexed Fields | Data Fields                    |
| ------------ | -------------- | ------------------------------ |
| `Claimed`    | `wallet`       | `token`, `amount`, `sgeAmount` |
| `Paused`     | `account`      | —                              |
| `Unpaused`   | `account`      | —                              |

---

## Frontend Call Sequence

```
1. hasClaimed(wallet)     → if true, show "Already claimed"
2. ERC20.allowance(w, c)  → if < claimAmount, proceed to approve
3. ERC20.approve(c, amt)  → set allowance
4. claimWithUSDC/USDT()   → execute claim
5. Parse Claimed event    → confirm success
```

---

## Notes

- Function selectors should be confirmed against the verified Etherscan source.
- The ABI in `/docs/sge/abi.json` is used by the frontend claim module.
- If `claimSGE()` turns out to be the primary entry point (accepting a token parameter), the frontend should be updated to use it instead.
