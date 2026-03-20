# SGE Deployment Checklist

> Comprehensive pre-deploy, deploy, and post-deploy checklists for the SGE legacy infrastructure.

---

## Pre-Deployment

### Environment

- [ ] `MAINNET_RPC_URL` set and reachable
- [ ] `PRIVATE_KEY` set (deployer wallet)
- [ ] Deployer wallet has ≥ 0.1 ETH (deployment costs ~0.05 ETH across 3 contracts)
- [ ] Node.js 18+ and `ts-node` available
- [ ] `.env` file populated per `.env.example`

### Verification

- [ ] Run `npx ts-node apps/web/scripts/preflight-sge-legacy.ts` — all PASS
- [ ] Confirmed `MAINNET_RPC_URL` connects to chain ID 1 (not testnet or fork)
- [ ] SGE token at `0x40489719E489782959486A04B765E1e93e5B221a` — confirmed name, symbol, decimals
- [ ] Funder wallet has SGE balance sufficient for planned distribution + vault reserve

### Review

- [ ] `SgeDistributor.sol` — reviewed, constructor args planned
- [ ] `SgeTreasuryVault.sol` — reviewed, constructor args planned
- [ ] `SgeAccessManager.sol` — reviewed, constructor args planned
- [ ] Default `claimAmount` value decided (e.g. 1000 SGE = `1000000000000000000000`)
- [ ] Admin address decided (ideally NOT the deployer — separate key)
- [ ] Operator address decided (ideally NOT the admin — separate key)

### Risk Acknowledgments

- [ ] SGE token is immutable — no admin, no pause, no rescue
- [ ] `transfer()` returns no bool — SafeERC20 handles this
- [ ] `approve()` has race condition — zero-first pattern required
- [ ] No Approval events — cannot rely on event logs
- [ ] Once deployed, contracts are immutable on mainnet
- [ ] Gas costs are real ETH — no refunds

---

## Deployment

### Execute

- [ ] Run `npx ts-node apps/web/scripts/deploy-sge-distributor.ts`
- [ ] Wait for all 3 deployments to confirm (≥ 1 block each)
- [ ] Verify `vault.setDistributor(distributor, true)` tx confirmed

### Record

- [ ] Copy SgeDistributor address → `SGE_DISTRIBUTOR_ADDRESS` in `.env`
- [ ] Copy SgeTreasuryVault address → `SGE_TREASURY_ADDRESS` in `.env`
- [ ] Copy SgeAccessManager address → `SGE_ACCESS_MANAGER_ADDRESS` in `.env`
- [ ] Save deployment manifest JSON (output by deploy script)
- [ ] Record all 4 deployment tx hashes (3 deploys + 1 grantRole)
- [ ] Record deployer address and ETH spent

### Immediate Verification

- [ ] Run preflight again — all 3 new contracts should show PASS
- [ ] Run inspect script — verify addresses, roles, pause states
- [ ] Verify on Etherscan: all 3 contracts visible at their addresses
- [ ] Verify on Etherscan: correct constructor args in creation tx

---

## Post-Deployment

### Funding

- [ ] Decide initial funding amount for distributor (e.g. 10,000 SGE)
- [ ] Decide initial reserve amount for vault (e.g. 50,000 SGE)
- [ ] Run `fund-sge-inventory.ts` with `SGE_FUND_TARGET=distributor`
- [ ] Run `fund-sge-inventory.ts` with `SGE_FUND_TARGET=vault` (if using vault)
- [ ] Run inspect to verify balances match expectations

### Role Setup

- [ ] If admin ≠ deployer: grant ADMIN_ROLE to target admin, then renounce from deployer
- [ ] Grant OPERATOR_ROLE to operator address on distributor
- [ ] Grant COMPLIANCE_ROLE on access manager (if using KYC/compliance features)
- [ ] Verify all roles via inspect script

### Access Manager Setup (if used)

- [ ] Configure allowlist (if using whitelist mode)
- [ ] Configure denylist (if using blacklist mode)
- [ ] Enable/disable KYC requirement
- [ ] Configure jurisdiction restrictions
- [ ] Test `canAccess()` with known addresses

### Testing

- [ ] Run claim dry-run: `DRY_RUN=true npx ts-node apps/web/scripts/test-sge-claim.ts`
- [ ] Verify gas estimation is reasonable
- [ ] Run live claim: `DRY_RUN=false npx ts-node apps/web/scripts/test-sge-claim.ts`
- [ ] Verify claim succeeded: claimant received SGE, `hasClaimed` is true
- [ ] Verify distributor inventory decreased by claim amount
- [ ] Run inspect to capture post-claim system state

### UI Verification

- [ ] Navigate to `/admin/sge` — overview loads, all contract addresses displayed
- [ ] Navigate to `/admin/sge/claims` — claims UI renders correctly
- [ ] Navigate to `/admin/sge/treasury` — treasury UI renders correctly
- [ ] Navigate to `/admin/sge/testing` — testing UI renders correctly
- [ ] All navigation links work from sidebar

### Documentation

- [ ] Record all deployment addresses in `LIVE-TEST-RUNBOOK.md`
- [ ] Archive deployment manifest
- [ ] Capture screenshots of Etherscan verification
- [ ] Update team on deployment status

---

## Rollback / Emergency

If anything goes wrong during or after deployment:

1. **Pause immediately**: Call `distributor.pause()` and `vault.pause()`
2. **Drain distributor**: Call `distributor.drainToTreasury()` to move SGE to vault
3. **Emergency withdraw vault**: Call `vault.emergencyWithdraw(safeAddress)` if needed
4. **Do NOT re-deploy** until root cause is identified and fixed
5. **Document the incident** in `LIVE-TEST-RUNBOOK.md`

---

## Contract Verification on Etherscan (Optional)

After deployment, you may want to verify contract source on Etherscan:

1. Navigate to contract address on Etherscan
2. Click "Verify and Publish"
3. Select Solidity ^0.8.20, optimizer settings matching deployment
4. Paste contract source + constructor args
5. Submit — verified contract shows source + read/write interface

**Note**: This is optional but strongly recommended for transparency.
