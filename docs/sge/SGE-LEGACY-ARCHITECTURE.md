# SGE Legacy Token — Architecture

> Complete technical architecture of the SGE legacy integration layer.

## Overview

The SGE token (`0x40489719E489782959486A04B765E1e93e5B221a`) is an immutable, non-standard ERC-20 token deployed on Ethereum Mainnet. It cannot be modified, upgraded, or rescued. This architecture wraps it in a modern, secure operational layer.

## Components

### 1. Legacy Token Adapter (`apps/web/src/lib/sge-legacy/`)

A TypeScript package that provides safe interaction with the legacy token.

| File | Purpose |
|------|---------|
| `config.ts` | Canonical config — address, metadata, legacy quirk flags |
| `abi.ts` | Separate read/write ABIs (write functions have no return types) |
| `client.ts` | Type-safe read/write helpers, zero-first approval, receipt-based verification |
| `script-config.ts` | Shared config for CLI scripts — addresses, ABIs, env helpers |
| `readiness.ts` | Async readiness checker for the full legacy infrastructure |
| `index.ts` | Barrel export |

### 2. Smart Contracts (`contracts/`)

Three Solidity ^0.8.20 contracts built on OpenZeppelin v5:

#### SgeDistributor.sol
- **Purpose**: Controlled distribution of SGE tokens
- **Roles**: `ADMIN_ROLE`, `OPERATOR_ROLE`
- **Capabilities**: Fund inventory, distribute, one-time claim (`claimExact`), pause/unpause, drain to treasury, rescue non-SGE tokens
- **Safety**: `SafeERC20`, `ReentrancyGuard`, `Pausable`
- **Constructor**: `(address _sgeToken, address _treasury, uint256 _claimAmount, address _admin)`

#### SgeTreasuryVault.sol
- **Purpose**: Secure custody separated from distribution logic
- **Roles**: `ADMIN_ROLE`, `DISTRIBUTOR_ROLE`
- **Capabilities**: Deposit, release, emergency withdraw, pause, rescue
- **Constructor**: `(address _sgeToken, address _admin)`

#### SgeAccessManager.sol
- **Purpose**: Compliance and access gate (no token custody)
- **Roles**: `ADMIN_ROLE`, `COMPLIANCE_ROLE`, `OPERATOR_ROLE`
- **Capabilities**: Allowlist, denylist, KYC, jurisdiction, operator override, batch operations
- **Key Function**: `canAccess(address) → (bool permitted, string reason)`
- **Constructor**: `(address _admin)`

### 3. CLI Scripts (`apps/web/scripts/`)

| Script | Type | Purpose |
|--------|------|---------|
| `preflight-sge-legacy.ts` | Read-only | Full system verification |
| `deploy-sge-distributor.ts` | Write (mainnet) | Deploy all 3 contracts + link |
| `fund-sge-inventory.ts` | Write (mainnet) | Move SGE into distributor/vault |
| `test-sge-claim.ts` | Write (mainnet) | Execute claimExact() or dry-run |
| `inspect-sge-system.ts` | Read-only | Print full system snapshot |

### 4. Admin UI (`apps/web/src/app/(app)/admin/sge/`)

| Route | Purpose |
|-------|---------|
| `/admin/sge` | Overview dashboard — contracts, quirks, CLI tools, architecture |
| `/admin/sge/claims` | Claims management — lookup, states, events, admin ops |
| `/admin/sge/treasury` | Treasury & inventory — funding flow, vault ops, readiness |
| `/admin/sge/testing` | Operator testing — env vars, test sequence, proof capture |

## Data Flow

```
Funder Wallet → (approve + fundInventory) → SgeDistributor
                                                ↓
                                         [inventoryBalance]
                                                ↓
                                    User → claimExact() → SGE to user
                                                ↓
                                         [hasClaimed = true]

Alternately:
Funder Wallet → (approve + deposit) → SgeTreasuryVault
                                           ↓
SgeDistributor ← (release, authorized) ← Vault
```

## Legacy Token Quirks

| Property | Value | Impact |
|----------|-------|--------|
| `transfer()` return | No bool | Must check `receipt.status`, not return value |
| `approve()` event | No Approval event emitted | Cannot rely on event logs for allowance tracking |
| `approve()` race | Vulnerable | Must use zero-first pattern: `approve(0)` then `approve(amount)` |
| Admin/Owner | None | Token is immutable — no admin, pause, rescue, upgrade |
| Solidity version | Pre-0.8 (no overflow protection) | Cannot be fixed; new contracts compensate |

## Environment Variables

All env vars are documented in `apps/web/.env.example`. Critical ones:

| Variable | Required | Used By |
|----------|----------|---------|
| `MAINNET_RPC_URL` | Yes | All scripts + readiness |
| `PRIVATE_KEY` | For writes | deploy, fund, claim scripts |
| `SGE_DISTRIBUTOR_ADDRESS` | After deploy | All legacy scripts |
| `SGE_TREASURY_ADDRESS` | After deploy | Preflight, inspect |
| `SGE_ACCESS_MANAGER_ADDRESS` | After deploy | Preflight, inspect |

## Security Model

1. **No single wallet holds all keys** — admin and operator roles are separate
2. **Pausable** — admin can freeze distributor and vault independently
3. **SafeERC20** — handles legacy token's missing return values
4. **ReentrancyGuard** — prevents re-entrancy on distribution
5. **One-time claim** — `hasClaimed` mapping prevents double-claiming
6. **Emergency withdraw** — vault admin can extract all funds to safe address
7. **Rescue** — admin can extract non-SGE tokens accidentally sent to contracts
