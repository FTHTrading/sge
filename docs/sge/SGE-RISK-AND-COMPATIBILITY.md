# SGE Risk & Compatibility Analysis

> Detailed analysis of the legacy SGE token's risks, non-standard behaviors, and the mitigations applied by the new infrastructure.

---

## 1. Legacy Token Profile

| Property | Value |
|----------|-------|
| Address | `0x40489719E489782959486A04B765E1e93e5B221a` |
| Network | Ethereum Mainnet (Chain ID 1) |
| Standard | Non-standard ERC-20 |
| Decimals | 18 |
| Total Supply | 100,000,000,000 SGE (100 billion) |
| Solidity Version | Pre-0.8 (no built-in overflow protection) |
| Upgradeable | No |
| Admin / Owner | None |
| Pausable | No |
| Contract Verified | No (on Etherscan) |

---

## 2. Non-Standard Behaviors

### 2.1 `transfer()` — No Boolean Return

**Risk**: Standard ERC-20 requires `transfer(to, amount) → bool`. The SGE token does NOT return a boolean. Callers that check the return value will revert or get garbage data.

**Impact**: Any contract or library that expects a bool from `transfer()` will fail.

**Mitigation**: 
- Solidity contracts use OpenZeppelin `SafeERC20` which handles missing return values via low-level call + returndata length check
- TypeScript client checks `receipt.status === 1` instead of decoding return value

### 2.2 `approve()` — No Approval Event

**Risk**: Standard ERC-20 emits `Approval(owner, spender, value)` on `approve()`. SGE does not.

**Impact**: Off-chain systems that track allowances via events will have stale data. Block explorers may not show allowance changes.

**Mitigation**:
- Never rely on Approval events — read `allowance()` directly
- UI and scripts call `readAllowance()` for current state

### 2.3 `approve()` — Race Condition

**Risk**: If spender has existing allowance and owner calls `approve(spender, newAmount)`, the spender can front-run and spend both the old and new allowance.

**Impact**: Potential double-spend of allowance during approval changes.

**Mitigation**:
- All approve operations use zero-first pattern: `approve(spender, 0)` then `approve(spender, amount)`
- Implemented in `client.ts` (`safeApprove`) and `fund-sge-inventory.ts`

### 2.4 Pre-0.8 Solidity — No Overflow Protection

**Risk**: Token was compiled with Solidity < 0.8, which has no built-in overflow/underflow protection.

**Impact**: Theoretical integer overflow in token internals. In practice, overflow in a token with 1B supply and 18 decimals is unlikely but cannot be ruled out.

**Mitigation**:
- New contracts use Solidity ^0.8.20 with built-in overflow protection
- SafeERC20 handles the interface boundary

---

## 3. Immutability Risks

### 3.1 No Admin / No Owner

The SGE token has no admin functions, no owner, no governance. It cannot be:
- Paused
- Upgraded
- Rescued (if tokens are stuck)
- Modified in any way

**Implication**: The token IS what it IS. All safety must come from wrapper contracts.

### 3.2 No Rescue Function

If SGE tokens are sent to an address by mistake, they cannot be recovered by the token contract. The new infrastructure mitigates this:
- `SgeDistributor.rescueToken()` — recovers non-SGE tokens sent to distributor by mistake
- `SgeTreasuryVault.rescueToken()` — same for vault
- **Note**: These rescue functions explicitly CANNOT extract the SGE token itself (by design, to prevent admin theft)

### 3.3 No Pause

The legacy token cannot be paused. If a vulnerability is found in the token itself, the only defense is:
- Pause the wrapper contracts (distributor + vault)
- Drain distributor to vault
- Emergency withdraw from vault to a safe address

---

## 4. Contract Risk Assessment

### SgeDistributor

| Risk | Severity | Mitigation |
|------|----------|------------|
| Re-entrancy on claim | High | `ReentrancyGuard` (nonReentrant modifier) |
| Double claim | High | `hasClaimed` mapping, checked before transfer |
| Admin key compromise | Critical | Separate ADMIN_ROLE and OPERATOR_ROLE |
| Inventory exhaustion | Medium | `inventoryBalance()` check, monitoring |
| Pause bypass | Low | `Pausable` modifier on all external functions |

### SgeTreasuryVault

| Risk | Severity | Mitigation |
|------|----------|------------|
| Unauthorized release | High | `DISTRIBUTOR_ROLE` required for `release()` |
| Admin key compromise | Critical | `emergencyWithdraw` requires ADMIN_ROLE |
| Re-entrancy | High | `ReentrancyGuard` |

### SgeAccessManager

| Risk | Severity | Mitigation |
|------|----------|------------|
| Misconfigured access | Medium | Multiple independent checks (deny → allow → KYC) |
| Operator override abuse | Medium | Operator overrides are temporary, logged |
| No token custody | N/A | This contract holds no funds |

---

## 5. Operational Risks

### 5.1 Gas Price Spikes

Mainnet gas prices are volatile. A claim operation that costs $2 at 20 gwei could cost $200 at 200 gwei.

**Mitigation**: Test-claim script estimates gas and reports cost before execution.

### 5.2 RPC Provider Downtime

If Alchemy/Infura is down, all operations fail.

**Mitigation**: Preflight checks RPC first. Configure a fallback provider.

### 5.3 Private Key Exposure

If the admin or deployer private key is compromised, an attacker can:
- Pause/unpause contracts
- Drain distributor to vault (or change treasury address first)
- Emergency withdraw vault

**Mitigation**: 
- Use hardware wallets for admin keys
- Separate admin and operator roles
- Monitor for unexpected role changes

### 5.4 Contract Not Verified on Etherscan

The legacy SGE token is NOT verified on Etherscan. This means:
- No public source code to audit
- ABI is derived from observed behavior
- Unknown internal logic

**Mitigation**: ABI is conservative — only includes functions confirmed to exist via manual testing.

---

## 6. SafeERC20 Strategy

OpenZeppelin's `SafeERC20` is the cornerstone of legacy compatibility:

```solidity
using SafeERC20 for IERC20;
IERC20(sgeToken).safeTransfer(to, amount);
```

**How it works**:
1. Makes a low-level `call` to `transfer(to, amount)`
2. Checks if the call reverted
3. If returndata is present AND ≥ 32 bytes, decodes it as bool and requires `true`
4. If returndata is empty, assumes success (this is the key: SGE returns nothing)

This handles ALL of SGE's non-standard behaviors at the Solidity level.

---

## 7. Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| Cannot verify allowance via events | Must read `allowance()` on-chain | All code uses direct reads |
| Cannot upgrade token | Quirks are permanent | Wrapper contracts compensate |
| Cannot pause token | No emergency stop for token itself | Pause wrapper contracts instead |
| Cannot rescue SGE from EOAs | No `rescueFrom` on token | User education, careful testing |
| Token not verified on Etherscan | Cannot audit internal logic | Conservative ABI, defensive coding |
| Pre-0.8 Solidity in token | Theoretical overflow risk | New contracts use ^0.8.20 |
| No standard `decimals()` guaranteed | Could return unexpected value | Hardcoded 18 in config, verified via preflight |

---

## 8. Recommendation Summary

1. **Always run preflight before any operation**
2. **Never skip the zero-first approval pattern**
3. **Never check return values from transfer/approve** — check receipt status
4. **Monitor balances directly** — do not rely on events
5. **Keep admin and operator keys separate** — ideally on different hardware wallets
6. **Verify contracts on Etherscan** after deployment for transparency
7. **Test with dry-run first** before any live mainnet operation
8. **Keep the deployer wallet funded** with ETH for future admin operations
