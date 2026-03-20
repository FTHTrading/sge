# SGE Admin Hardening Guide

> **Audience:** Operator / deployer managing the SGE Distributor, Vault, and AccessManager contracts on Ethereum Mainnet.

---

## 1. Role Architecture

All three contracts use OpenZeppelin `AccessControl` with these roles:

| Contract | Role | keccak256 Hash | Purpose |
|---|---|---|---|
| SgeDistributor | `DEFAULT_ADMIN_ROLE` | `0x00…00` | Can grant/revoke all other roles |
| SgeDistributor | `ADMIN_ROLE` | `0xa498…1775` | Pause, unpause, set treasury/claim amount, drain, rescue |
| SgeDistributor | `OPERATOR_ROLE` | `0x9766…b929` | Call `distribute()` to send tokens to recipients |
| SgeTreasuryVault | `DEFAULT_ADMIN_ROLE` | `0x00…00` | Can grant/revoke all other roles |
| SgeTreasuryVault | `ADMIN_ROLE` | `0xa498…1775` | Pause, unpause, emergency withdraw, rescue |
| SgeTreasuryVault | `DISTRIBUTOR_ROLE` | `0x85fa…862d` | Distributor contract can call `release()` |
| SgeAccessManager | `DEFAULT_ADMIN_ROLE` | `0x00…00` | Can grant/revoke all other roles |
| SgeAccessManager | `ADMIN_ROLE` | `0xa498…1775` | Toggle allowlist, KYC, jurisdiction settings |
| SgeAccessManager | `COMPLIANCE_ROLE` | `0x7935…4f55` | Set allowed/denied/KYC status per address |
| SgeAccessManager | `OPERATOR_ROLE` | `0x9766…b929` | Set operator overrides (bypass access) |

### Role Matrix (expected assignments)

```
                    DEFAULT_ADMIN  ADMIN  OPERATOR  COMPLIANCE  DISTRIBUTOR
Distributor         admin          admin  operator  —           —
TreasuryVault       admin          admin  —         —           distributor
AccessManager       admin          admin  operator  compliance  —
```

---

## 2. Admin EOA vs Multisig

### Current Risk: EOA Admin

If the admin address is a plain Externally Owned Account (EOA):
- **Single point of failure** — one compromised private key can drain everything
- **No time lock** — admin operations execute immediately
- **No approval workflow** — no co-signer required

### Recommendation: Transfer to Multisig

Use a Safe (formerly Gnosis Safe) multisig with:
- **2-of-3** threshold minimum (3-of-5 recommended for production)
- All signers on separate hardware wallets
- At least one signer in a different geographic location

### Transfer Procedure

```bash
# 1. Deploy Safe multisig at safe.global
# 2. Note the Safe address (e.g., 0xSAFE...)

# 3. Grant all roles to the Safe on each contract:
#    (from the current admin EOA)

cast send $DISTRIBUTOR "grantRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  $SAFE_ADDRESS

cast send $DISTRIBUTOR "grantRole(bytes32,address)" \
  $(cast keccak "ADMIN_ROLE") $SAFE_ADDRESS

# 4. Repeat for Vault and AccessManager

# 5. VERIFY the Safe has all roles:
cast call $DISTRIBUTOR "hasRole(bytes32,address)(bool)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  $SAFE_ADDRESS

# 6. ONLY AFTER VERIFICATION — revoke from the EOA:
cast send $DISTRIBUTOR "renounceRole(bytes32,address)" \
  $(cast keccak "ADMIN_ROLE") $EOA_ADDRESS

# 7. Revoke DEFAULT_ADMIN_ROLE from EOA LAST:
cast send $DISTRIBUTOR "renounceRole(bytes32,address)" \
  0x0000000000000000000000000000000000000000000000000000000000000000 \
  $EOA_ADDRESS
```

**CAUTION:** Always verify the Safe has the role BEFORE revoking from the EOA. Losing all DEFAULT_ADMIN_ROLE holders is **irrecoverable**.

### Readiness Check

The readiness module (`checkLegacyReadiness()`) will emit:
- **WARN** if admin is a plain EOA (code.length == 0)
- **PASS** if admin is a smart contract (likely multisig)

---

## 3. Operator Separation

The `OPERATOR_ROLE` should be held by a **hot wallet** used for day-to-day operations:
- Calling `distribute()` on the Distributor
- Setting operator overrides on the AccessManager
- Monitoring and responding to events

The **admin wallet** (multisig) should only be used for:
- Pausing/unpausing contracts
- Changing treasury, claim amounts
- Emergency withdrawals
- Granting/revoking roles
- Draining inventory

### Separation Script

```bash
# Grant OPERATOR_ROLE to a dedicated hot wallet:
npx ts-node scripts/inspect-sge-system.ts  # verify current state

cast send $DISTRIBUTOR "setOperator(address,bool)" $OPERATOR_WALLET true
cast send $ACCESS_MANAGER "grantRole(bytes32,address)" \
  $(cast keccak "OPERATOR_ROLE") $OPERATOR_WALLET

# Set env:
# SGE_OPERATOR_ADDRESS=0x...
```

---

## 4. Emergency Procedures

### 4a. Pause Everything

```bash
# Pause distributor (stops claims)
cast send $DISTRIBUTOR "pause()" --from $ADMIN

# Pause vault (stops releases)
cast send $VAULT "pause()" --from $ADMIN
```

### 4b. Drain Inventory

```bash
# Moves all distributor inventory to treasury vault
cast send $DISTRIBUTOR "drainToTreasury()" --from $ADMIN
```

### 4c. Emergency Withdraw (Vault)

```bash
# Moves ALL vault funds to specified address
cast send $VAULT "emergencyWithdraw(address)" $SAFE_ADDRESS --from $ADMIN
```

### 4d. Rescue Accidentally Sent Tokens

```bash
# Rescue non-SGE tokens accidentally sent to distributor
cast send $DISTRIBUTOR "rescueToken(address,address,uint256)" \
  $TOKEN_ADDRESS $SAFE_ADDRESS $AMOUNT --from $ADMIN
```

---

## 5. Monitoring Checklist

| Check | Frequency | Alert Threshold |
|---|---|---|
| Distributor inventory balance | Every 15 min | < 50 claims worth |
| Distributor paused state | Every 5 min | Paused unexpectedly |
| Vault balance | Every 15 min | < 100,000 SGE |
| Role changes (RoleGranted/Revoked events) | Real-time | Any change |
| Admin ETH balance | Every hour | < 0.01 ETH |
| Operator ETH balance | Every hour | < 0.01 ETH |
| Claim rate | Daily | > 100/day (unusual) |

Use the event-reader module (`getRecentClaims()`, `checkInventoryHealth()`) for programmatic monitoring.

---

## 6. Etherscan Verification

Unverified contracts cannot be interacted with via Etherscan's "Write Contract" tab. Verify immediately after deployment:

```bash
# Using the verification script:
ETHERSCAN_API_KEY=... npx ts-node scripts/verify-sge-contracts.ts

# Or via Hardhat directly:
npx hardhat verify --network mainnet --contract contracts/SgeAccessManager.sol:SgeAccessManager $AM_ADDR $ADMIN_ADDR
npx hardhat verify --network mainnet --contract contracts/SgeTreasuryVault.sol:SgeTreasuryVault $VAULT_ADDR $TOKEN_ADDR $ADMIN_ADDR
npx hardhat verify --network mainnet --contract contracts/SgeDistributor.sol:SgeDistributor $DIST_ADDR $TOKEN_ADDR $VAULT_ADDR $CLAIM_AMT $ADMIN_ADDR
```

### Manual Verification (fallback)

1. Go to `https://etherscan.io/verifyContract?a=<ADDRESS>`
2. Compiler: **v0.8.20+commit.a1b79de6**
3. Optimizer: **Enabled, 200 runs**
4. EVM target: **paris**
5. License: MIT
6. Paste flattened source (from `npx hardhat flatten`)
7. Paste ABI-encoded constructor args from `verify-sge-contracts.ts` output

---

## 7. Pre-Production Checklist

- [ ] All 3 contracts deployed and linked
- [ ] Etherscan verification complete for all 3
- [ ] Admin transferred to multisig (Safe)
- [ ] Operator wallet funded with ETH (≥ 0.05 ETH)
- [ ] Operator has OPERATOR_ROLE on Distributor
- [ ] Operator has OPERATOR_ROLE on AccessManager
- [ ] Compliance address has COMPLIANCE_ROLE on AccessManager
- [ ] Distributor has DISTRIBUTOR_ROLE on Vault
- [ ] Distributor inventory funded (≥ 1M SGE for launch)
- [ ] Readiness check passes with 0 FAIL
- [ ] Preflight script passes: `npx ts-node scripts/preflight-sge-legacy.ts`
- [ ] Test claim succeeds in DRY_RUN mode
- [ ] Monitoring alerts configured
- [ ] Emergency pause procedure tested on testnet
- [ ] Incident response contacts documented
