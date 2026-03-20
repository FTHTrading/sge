# SGE Runtime Requirements

> Everything needed to compile, deploy, and operate the SGE legacy integration layer.

---

## 1. Development Environment

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | ≥ 18.0 | Runtime for scripts, tests, Next.js |
| pnpm | ≥ 8.0 | Monorepo package manager |
| TypeScript | 5.5+ | Type checking |
| Vitest | 4.1.0 | Test runner |
| ethers.js | v6 | Ethereum interaction |

## 2. Solidity Compilation

One of the following is required to compile the 3 contracts:

### Option A: Hardhat

```bash
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat compile
```

Output: `artifacts/contracts/{SgeDistributor,SgeTreasuryVault,SgeAccessManager}.sol/*.json`

### Option B: Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge install OpenZeppelin/openzeppelin-contracts
forge build
```

Output: `out/{SgeDistributor,SgeTreasuryVault,SgeAccessManager}.sol/*.json`

**Note**: The deploy script checks both paths automatically.

## 3. Dependencies

### OpenZeppelin Contracts v5

All 3 contracts import from `@openzeppelin/contracts/`:

| Import | Used By |
|--------|---------|
| `access/AccessControl.sol` | All 3 contracts |
| `utils/ReentrancyGuard.sol` | SgeDistributor, SgeTreasuryVault |
| `utils/Pausable.sol` | SgeDistributor, SgeTreasuryVault |
| `token/ERC20/utils/SafeERC20.sol` | SgeDistributor, SgeTreasuryVault |
| `token/ERC20/IERC20.sol` | SgeDistributor, SgeTreasuryVault |

### ethers.js v6

Used by all CLI scripts and the `sge-legacy/` adapter package:
- `ethers.Contract` for all on-chain reads/writes
- `ethers.JsonRpcProvider` for RPC connections
- `ethers.Wallet` for transaction signing
- `ethers.formatUnits` / `ethers.parseUnits` for value conversion

## 4. Environment Variables

### Required for ALL operations

| Variable | Example | Used By |
|----------|---------|---------|
| `MAINNET_RPC_URL` | `https://eth-mainnet.g.alchemy.com/v2/KEY` | All scripts, readiness checks |

### Required for WRITE operations

| Variable | Example | Used By |
|----------|---------|---------|
| `PRIVATE_KEY` | `0xabc...def` | deploy, fund, claim scripts |

### Required after deployment

| Variable | Example | Used By |
|----------|---------|---------|
| `SGE_DISTRIBUTOR_ADDRESS` | `0x...` | All post-deploy scripts |
| `SGE_TREASURY_ADDRESS` | `0x...` | Preflight, inspect |
| `SGE_ACCESS_MANAGER_ADDRESS` | `0x...` | Preflight, inspect |

### Optional configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `SGE_ADMIN_ADDRESS` | Deployer | Admin role holder |
| `SGE_OPERATOR_ADDRESS` | Deployer | Operator role holder |
| `SGE_CLAIM_AMOUNT` | `1000` | SGE per claim (human-readable) |
| `SGE_FUND_AMOUNT` | `10000` | Amount to fund distributor/vault |
| `SGE_FUND_TARGET` | `distributor` | `"distributor"` or `"vault"` |
| `DRY_RUN` | `true` | Claim script dry-run mode |

### UI (NEXT_PUBLIC_)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SGE_DISTRIBUTOR_ADDRESS` | Show deploy status in admin UI |
| `NEXT_PUBLIC_SGE_TREASURY_ADDRESS` | Show deploy status in admin UI |
| `NEXT_PUBLIC_SGE_ACCESS_MANAGER_ADDRESS` | Show deploy status in admin UI |

## 5. Network Requirements

| Property | Value |
|----------|-------|
| Network | Ethereum Mainnet |
| Chain ID | 1 |
| RPC provider | Alchemy, Infura, or any Mainnet RPC |
| Gas token | ETH |
| Minimum deployer ETH | 0.1 ETH (for 3 contract deployments + linking) |
| Minimum operator ETH | 0.01 ETH (for ongoing admin operations) |

## 6. Contract Addresses (Fixed)

These addresses are hardcoded in `config.ts` and `sge.ts`:

| Entity | Address | Network |
|--------|---------|---------|
| SGE Token | `0x40489719E489782959486A04B765E1e93e5B221a` | Mainnet |
| Original Claim | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` | Mainnet |
| Owner | `0x9ffE2f6f306fB9bE0b8b9558fC4B86dc43A39Cb7` | Mainnet |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | Mainnet |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Mainnet |

## 7. Contract Addresses (Deployed)

These are set in `.env` after deployment and are initially empty:

| Entity | Env Var |
|--------|---------|
| SgeDistributor | `SGE_DISTRIBUTOR_ADDRESS` |
| SgeTreasuryVault | `SGE_TREASURY_ADDRESS` |
| SgeAccessManager | `SGE_ACCESS_MANAGER_ADDRESS` |

## 8. Operational Scripts

All scripts are in `apps/web/scripts/`. Run from the `apps/web` directory:

| Script | Command | Type | Requires |
|--------|---------|------|----------|
| Preflight | `npx ts-node scripts/preflight-sge-legacy.ts` | Read-only | RPC |
| Deploy | `npx ts-node scripts/deploy-sge-distributor.ts` | Write | RPC + KEY + compiled artifacts |
| Fund | `npx ts-node scripts/fund-sge-inventory.ts` | Write | RPC + KEY + deployed contracts |
| Claim test | `npx ts-node scripts/test-sge-claim.ts` | Write | RPC + KEY + deployed contracts |
| Inspect | `npx ts-node scripts/inspect-sge-system.ts` | Read-only | RPC + deployed contracts |

## 9. Test Execution

```bash
# From monorepo root
npx vitest run

# Run only SGE legacy adapter tests
npx vitest run tests/sge/legacy-adapter.spec.ts
```

Current: **127/127 tests passing** across 7 files.

## 10. Pre-Deployment Sequence

```
1. Install Node.js 18+, pnpm
2. pnpm install
3. Install Hardhat or Foundry
4. npx hardhat compile (or forge build)
5. Set .env: MAINNET_RPC_URL, PRIVATE_KEY
6. npx ts-node scripts/preflight-sge-legacy.ts
7. npx ts-node scripts/deploy-sge-distributor.ts
8. Update .env with deployed addresses
9. npx ts-node scripts/preflight-sge-legacy.ts (re-verify)
10. npx ts-node scripts/fund-sge-inventory.ts
11. DRY_RUN=true npx ts-node scripts/test-sge-claim.ts
12. DRY_RUN=false npx ts-node scripts/test-sge-claim.ts
```
