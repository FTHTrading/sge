# SGE Contract Audit

> Technical audit of all Solidity smart contracts in the SGE legacy integration layer.

---

## Contracts Reviewed

| Contract | File | Lines | Solidity | OpenZeppelin |
|----------|------|------:|----------|------------|
| SgeDistributor | `contracts/SgeDistributor.sol` | 165 | ^0.8.20 | AccessControl, ReentrancyGuard, Pausable, SafeERC20 |
| SgeTreasuryVault | `contracts/SgeTreasuryVault.sol` | 121 | ^0.8.20 | AccessControl, ReentrancyGuard, Pausable |
| SgeAccessManager | `contracts/SgeAccessManager.sol` | 134 | ^0.8.20 | AccessControl |

All contracts import from OpenZeppelin v5 (`@openzeppelin/contracts/...`).

---

## SgeDistributor

### Purpose
Controlled distribution of legacy SGE tokens with role-based access, pause capability, and one-time claim enforcement.

### Constructor
```solidity
constructor(address _sgeToken, address _treasury, uint256 _claimAmount, address _admin)
```
- Stores SGE token address (immutable after deploy)
- Sets treasury address
- Sets default claim amount
- Grants `DEFAULT_ADMIN_ROLE` and `ADMIN_ROLE` to deployer
- Grants `OPERATOR_ROLE` to deployer

### Role Model

| Role | Granted To | Capabilities |
|------|-----------|--------------|
| `ADMIN_ROLE` | Admin | pause, unpause, setTreasury, setClaimAmount, setOperator, rescueToken, drainToTreasury |
| `OPERATOR_ROLE` | Operator | distribute (targeted send) |
| `DEFAULT_ADMIN_ROLE` | (inherited) | Manage all roles |

### Functions

| Function | Access | Mutates | Notes |
|----------|--------|---------|-------|
| `fundInventory(uint256)` | Public | Yes | Anyone can fund. Uses `safeTransferFrom`. |
| `inventoryBalance()` | Public | No | Returns SGE balance held by contract |
| `distribute(address, uint256)` | OPERATOR | Yes | Sends SGE to any address. Nonreentrant + whenNotPaused. |
| `claimExact()` | Public | Yes | One-time claim. Checks `hasClaimed[msg.sender]`. Nonreentrant + whenNotPaused. |
| `pause()` / `unpause()` | ADMIN | Yes | Pauses/unpauses all distribution |
| `setTreasury(address)` | ADMIN | Yes | Changes treasury address |
| `setClaimAmount(uint256)` | ADMIN | Yes | Changes default claim amount |
| `setOperator(address, bool)` | ADMIN | Yes | Grants/revokes OPERATOR_ROLE |
| `rescueToken(address, address, uint256)` | ADMIN | Yes | Rescues non-SGE tokens. **Cannot extract SGE itself.** |
| `drainToTreasury()` | ADMIN | Yes | Sends all SGE to treasury |

### Security Analysis

| Check | Status | Notes |
|-------|--------|-------|
| Re-entrancy protection | PASS | `nonReentrant` on `distribute`, `claimExact`, `drainToTreasury` |
| Access control | PASS | Role-gated on all admin/operator functions |
| Pausable | PASS | `whenNotPaused` on `distribute`, `claimExact` |
| SafeERC20 | PASS | All token operations use `safeTransfer` / `safeTransferFrom` |
| Double-claim prevention | PASS | `hasClaimed` mapping checked before transfer |
| Inventory check | PASS | `claimExact` requires `inventoryBalance() >= claimAmount` |
| Rescue limitation | PASS | `rescueToken` rejects `sgeToken` address |

### Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| D1 | `drainToTreasury()` emits `Distributed(msg.sender, treasury, balance)` — reuses distribution event for a fundamentally different operation | MEDIUM | Documented — recommend adding `DrainedToTreasury` event |
| D2 | `fundInventory()` is public — anyone can deposit SGE into the contract | LOW/INFO | By design — permissionless funding |
| D3 | AccessManager is not queried in `claimExact()` — compliance is off-chain only | HIGH | Documented — intentional design decision; AccessManager deployed for future integration |

---

## SgeTreasuryVault

### Purpose
Secure custody of SGE tokens, separated from distribution logic.

### Constructor
```solidity
constructor(address _sgeToken, address _admin)
```
- Stores SGE token address
- Grants `DEFAULT_ADMIN_ROLE` and `ADMIN_ROLE` to admin

### Role Model

| Role | Granted To | Capabilities |
|------|-----------|--------------|
| `ADMIN_ROLE` | Admin | pause, unpause, emergencyWithdraw, rescueToken, setDistributor |
| `DISTRIBUTOR_ROLE` | Distributor contract | release (withdraw to recipient) |

### Functions

| Function | Access | Mutates | Notes |
|----------|--------|---------|-------|
| `deposit(uint256)` | Public | Yes | Anyone can deposit. Uses `safeTransferFrom`. |
| `balance()` | Public | No | Returns SGE balance held by vault |
| `release(address, uint256)` | DISTRIBUTOR | Yes | Sends SGE to recipient. Nonreentrant + whenNotPaused. |
| `emergencyWithdraw(address)` | ADMIN | Yes | Sends ALL SGE to safe address |
| `rescueToken(address, address, uint256)` | ADMIN | Yes | Rescues non-SGE tokens |
| `setDistributor(address, bool)` | ADMIN | Yes | Grants/revokes DISTRIBUTOR_ROLE |
| `pause()` / `unpause()` | ADMIN | Yes | Pauses/unpauses vault |

### Security Analysis

| Check | Status | Notes |
|-------|--------|-------|
| Re-entrancy protection | PASS | `nonReentrant` on `release`, `emergencyWithdraw` |
| Access control | PASS | Role-gated on all sensitive functions |
| Pausable | PASS | `whenNotPaused` on `release` |
| SafeERC20 | PASS | All token operations via `safeTransfer` / `safeTransferFrom` |
| Rescue limitation | PASS | `rescueToken` rejects `sgeToken` address |

### Findings

No critical or high issues found.

---

## SgeAccessManager

### Purpose
Compliance and access gate. No token custody. Provides `canAccess(address)` that returns `(bool, string)`.

### Constructor
```solidity
constructor(address _admin)
```
- Grants `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE`, `COMPLIANCE_ROLE`, `OPERATOR_ROLE` to admin

### Access Logic (in `canAccess()`)

```
1. Check operator overrides → if exists, return override value
2. Check denylist → if denied, return false + "Address is denied"
3. Check allowlist → if enabled and not on list, return false + "Not on allowlist"
4. Check KYC → if required and not verified, return false + "KYC not completed"
5. Return true + "Access permitted"
```

### Functions

| Function | Access | Notes |
|----------|--------|-------|
| `canAccess(address)` | Public view | Returns `(bool permitted, string reason)` |
| `setAllowed(address, bool)` | COMPLIANCE | Add/remove from allowlist |
| `setDenied(address, bool)` | COMPLIANCE | Add/remove from denylist |
| `setKycStatus(address, bool)` | COMPLIANCE | Set KYC status |
| `setOperatorOverride(address, bool)` | OPERATOR | Temporary override |
| `setAllowlistEnabled(bool)` | ADMIN | Toggle allowlist enforcement |
| `setKycRequired(bool)` | ADMIN | Toggle KYC requirement |
| `setJurisdiction(string)` | ADMIN | Set jurisdiction label |
| `batchSetAllowed(address[], bool)` | COMPLIANCE | Bulk operations |
| `batchSetDenied(address[], bool)` | COMPLIANCE | Bulk operations |

### Security Analysis

| Check | Status | Notes |
|-------|--------|-------|
| No token custody | PASS | Contract holds no funds |
| Access control | PASS | Role-gated on all state-changing functions |
| View function safety | PASS | `canAccess` is pure view — no state changes |

### Findings

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| A1 | All 4 roles granted to single admin in constructor | LOW | Expected for initial deploy; admin should redistribute roles post-deploy |
| A2 | `setOperatorOverride` has no expiry mechanism | LOW | Overrides persist until explicitly removed |

---

## Cross-Contract Interactions

```
User → claimExact() → SgeDistributor → safeTransfer(SGE → user)
Admin → drainToTreasury() → SgeDistributor → safeTransfer(SGE → SgeTreasuryVault)
Distributor → release() → SgeTreasuryVault → safeTransfer(SGE → recipient)
Operator → canAccess() → SgeAccessManager → returns (bool, string) [NOT wired into claimExact]
```

---

## Compilation Status

**Not yet compiled.** The monorepo does not contain a `hardhat.config.ts` or `foundry.toml`. Contracts must be compiled before deployment using either:
- Hardhat: `npx hardhat compile`
- Foundry: `forge build`

The deploy script (`deploy-sge-distributor.ts`) expects compiled artifacts at `artifacts/contracts/` (Hardhat) or `out/` (Foundry) relative to the monorepo root.
