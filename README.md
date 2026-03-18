<div align="center">

# SGE Alignment OS
**Scalable Green Energy — Instant Settlement System**

[![Ethereum](https://img.shields.io/badge/Network-Ethereum_Mainnet-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://etherscan.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ethers.js](https://img.shields.io/badge/ethers.js-v6-764ABC?style=for-the-badge)](https://docs.ethers.org/v6/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#license)

*On-chain instant settlement for SGE Foundation activation — ETH and SGE token transfers executed directly on Ethereum Mainnet.*

</div>

---

## What This Does

This system executes **real on-chain settlement** to activate a wallet's foundational position in the SGE ecosystem. It sends ETH (for gas) and SGE tokens to the target wallet in a single CLI command, with full pre-flight validation and Etherscan-verified receipts.

| | Address |
|--|---------|
| **Target Wallet** | `0x1FF7251B479818d0529b65d89AD314E47E5DA922` |
| **SGE Token (ERC-20)** | `0x40489719E489782959486A04B765E1e93e5B221a` |
| **SGE Claim Contract** | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` |

---

## Settlement Flow Tree

```
┌─────────────────────────────────────────────────────────────┐
│                   SGE INSTANT SETTLEMENT                     │
│                        Flow Tree                             │
└─────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │  START        │
  │  settle.ts    │
  └──────┬───────┘
         │
         ▼
  ┌──────────────────────┐     ┌─────────────────────┐
  │ Load .env.local      │────▶│ SENDER_PRIVATE_KEY   │
  │ Read configuration   │     │ RPC_URL (optional)   │
  └──────┬───────────────┘     └─────────────────────┘
         │
         ▼
  ┌──────────────────────┐     ┌─────────────────────┐
  │ Parse CLI Arguments  │────▶│ --eth <amount>       │
  │                      │     │ --sge <amount>       │
  └──────┬───────────────┘     └─────────────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ Connect to Ethereum  │
  │ Verify Chain ID = 1  │──── Chain ID ≠ 1? ──▶ EXIT
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ PRE-FLIGHT CHECK     │
  │                      │
  │ • Sender ETH balance │
  │ • Sender SGE balance │
  │ • Target ETH balance │
  │ • Target SGE balance │
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ VALIDATE FUNDS       │
  │                      │
  │ ETH >= amount + gas? │──── Insufficient? ──▶ EXIT
  │ SGE >= amount?       │──── Insufficient? ──▶ EXIT
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────┐
  │ 5-SECOND COUNTDOWN   │──── Ctrl+C? ──▶ ABORT
  │ Safety window        │
  └──────┬───────────────┘
         │
         ▼
  ┌──────────────────────────────────────────────┐
  │              EXECUTE SETTLEMENT               │
  │                                               │
  │  ┌────────────────────┐                       │
  │  │ Step 1: Send ETH   │                       │
  │  │ sender ──▶ target   │                      │
  │  │ Wait for block     │──▶ TX Hash + Block    │
  │  └────────┬───────────┘                       │
  │           │                                   │
  │           ▼                                   │
  │  ┌────────────────────┐                       │
  │  │ Step 2: Send SGE   │                       │
  │  │ ERC-20 transfer()  │                       │
  │  │ sender ──▶ target   │                      │
  │  │ Wait for block     │──▶ TX Hash + Block    │
  │  └────────┬───────────┘                       │
  │           │                                   │
  └───────────┼───────────────────────────────────┘
              │
              ▼
  ┌──────────────────────┐
  │ SETTLEMENT COMPLETE  │
  │                      │
  │ • Final ETH balance  │
  │ • Final SGE balance  │
  │ • Etherscan TX links │
  │ • Wallet link        │
  └──────────────────────┘
```

---

## On-Chain Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    ETHEREUM MAINNET                       │
│                                                          │
│  ┌──────────────────┐        ┌───────────────────────┐  │
│  │  Sender Wallet    │──ETH──▶│  Target Wallet        │  │
│  │  (your key)       │        │  0x1FF7...922         │  │
│  │                   │──SGE──▶│                       │  │
│  └──────────────────┘        └───────────┬───────────┘  │
│                                           │              │
│  ┌──────────────────┐                     │              │
│  │  SGE Token        │◀── balanceOf() ────┘              │
│  │  0x4048...21a     │                                   │
│  │  (ERC-20)         │                                   │
│  └──────────────────┘                                    │
│                                                          │
│  ┌──────────────────┐                                    │
│  │  SGE Claim        │  Settlement contract for          │
│  │  0x4BFe...D09     │  claim-based activation           │
│  └──────────────────┘                                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | >= 20 |
| pnpm | >= 9 |
| Funded wallet | ETH + SGE tokens on Mainnet |

### 1. Clone and Install

```bash
git clone https://github.com/FTHTrading/sge-alignment-os.git
cd sge-alignment-os
pnpm install
```

### 2. Configure Environment

```bash
cd apps/web
cp .env.local.example .env.local
```

Edit `apps/web/.env.local` and set:

```env
# REQUIRED — Private key of the wallet that holds ETH + SGE to send
SENDER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# OPTIONAL — Ethereum RPC endpoint (defaults to https://eth.llamarpc.com)
RPC_URL=https://eth.llamarpc.com
```

> **SECURITY:** Never commit your private key. The `.gitignore` excludes all `.env*` files.

### 3. Verify Wallet State (Pre-Flight)

Check current balances and claim status before settling:

```bash
npx tsx scripts/verify-wallet.ts
```

Output includes:
- ETH, SGE, USDC, USDT balances on the target wallet
- Allowances towards the claim contract
- Whether the wallet has already claimed
- Claim contract funding status
- Etherscan links for all contracts

### 4. Execute Settlement

```bash
# Send both ETH and SGE
npx tsx scripts/settle.ts --eth 0.05 --sge 5000

# SGE only (target already has ETH for gas)
npx tsx scripts/settle.ts --sge 2500

# ETH only
npx tsx scripts/settle.ts --eth 0.02
```

**What happens when you run it:**

```
╔═══════════════════════════════════════════════╗
║  SGE INSTANT SETTLEMENT                       ║
╚═══════════════════════════════════════════════╝

  Sender:  0xYourWallet...
  Target:  0x1FF7251B479818d0529b65d89AD314E47E5DA922
  Chain:   Ethereum Mainnet ✅

  ─── Current Balances ───
  Sender ETH:  1.234
  Sender SGE:  50000.0
  Target ETH:  0.001
  Target SGE:  0.0

  ─── Settlement Plan ───
  → Send 0.05 ETH
  → Send 5000 SGE

  ⚠️  Executing in 5 seconds... Ctrl+C to abort.
  5...4...3...2...1... GO

  → Sending ETH...
    TX: 0xabc123...
    https://etherscan.io/tx/0xabc123...
    ✅ Confirmed block 19500001

  → Sending SGE...
    TX: 0xdef456...
    https://etherscan.io/tx/0xdef456...
    ✅ Confirmed block 19500002

  ═══════════════════════════════════════════
  ✅ SETTLEMENT COMPLETE
  ═══════════════════════════════════════════

  Target: 0x1FF7251B479818d0529b65d89AD314E47E5DA922
  ETH:    0.051
  SGE:    5000.0

  ETH → https://etherscan.io/tx/0xabc123...  (block 19500001)
  SGE → https://etherscan.io/tx/0xdef456...  (block 19500002)

  Wallet: https://etherscan.io/address/0x1FF7251B479818d0529b65d89AD314E47E5DA922
```

---

## Scripts Reference

| Script | Purpose | Command |
|--------|---------|---------|
| **settle.ts** | Execute instant settlement (ETH + SGE) | `npx tsx scripts/settle.ts --eth <n> --sge <n>` |
| **verify-wallet.ts** | Check balances, allowances, claim status | `npx tsx scripts/verify-wallet.ts` |
| **send-eth-and-sge.ts** | Legacy funding script (fixed amounts) | `npx tsx scripts/send-eth-and-sge.ts` |

---

## Implementation Details

### Settlement Script (`settle.ts`)

The core settlement script performs direct ERC-20 token transfers on Ethereum Mainnet:

1. **Environment Loading** — Reads `SENDER_PRIVATE_KEY` and `RPC_URL` from `apps/web/.env.local`
2. **Argument Parsing** — Accepts `--eth` and `--sge` amounts via CLI flags
3. **Chain Verification** — Connects to RPC and confirms Chain ID = 1 (Mainnet)
4. **Pre-flight Balances** — Queries on-chain balances for both sender and target
5. **Fund Validation** — Ensures sender has enough ETH (amount + 0.005 gas buffer) and SGE
6. **Safety Countdown** — 5-second delay with Ctrl+C abort capability
7. **ETH Transfer** — Native `sendTransaction()` via ethers.js v6
8. **SGE Transfer** — ERC-20 `transfer()` call on the SGE token contract
9. **Receipt Confirmation** — Waits for block confirmation on each transaction
10. **Settlement Report** — Prints final balances and Etherscan links

### Verification Script (`verify-wallet.ts`)

Read-only script that queries Ethereum Mainnet state:

- Target wallet ETH, SGE, USDC, USDT balances
- USDC/USDT allowances towards the SGE Claim contract
- `hasClaimed()` status on the claim contract
- `CLAIM_AMOUNT()` from the claim contract
- Contract SGE balance (funded vs drained)

### Settlement Adapter (`src/lib/settlement/adapter.ts`)

Unified service layer used by the web UI, supporting both real and demo modes:

- Wallet connection and chain switching
- Token balance and allowance queries
- ERC-20 approval flow
- Claim execution and receipt waiting
- Full orchestrated activation flow with progress callbacks

---

## File Structure

```
sge-alignment-os/
├── apps/web/
│   ├── scripts/
│   │   ├── settle.ts              ← PRIMARY: Instant settlement CLI
│   │   ├── verify-wallet.ts       ← Pre-flight wallet check
│   │   └── send-eth-and-sge.ts    ← Legacy funding (fixed amounts)
│   ├── src/lib/
│   │   ├── config/
│   │   │   ├── sge.ts             ← Contract addresses, chain config
│   │   │   └── demo.ts            ← Demo mode configuration
│   │   ├── settlement/
│   │   │   └── adapter.ts         ← Settlement adapter (real + demo)
│   │   ├── activation-store.ts    ← Activation state types
│   │   └── web3/                  ← Low-level Web3 helpers
│   └── .env.local                 ← Your keys (never committed)
├── .github/workflows/
│   └── deploy.yml                 ← GitHub Pages demo deployment
└── README.md                      ← This file
```

---

## Contract Addresses (Etherscan)

| Contract | Address | Link |
|----------|---------|------|
| SGE Token (ERC-20) | `0x40489719E489782959486A04B765E1e93e5B221a` | [View on Etherscan](https://etherscan.io/token/0x40489719E489782959486A04B765E1e93e5B221a) |
| SGE Claim | `0x4BFeF695a5f85a65E1Aa6015439f317494477D09` | [View on Etherscan](https://etherscan.io/address/0x4BFeF695a5f85a65E1Aa6015439f317494477D09) |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` | [View on Etherscan](https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48) |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | [View on Etherscan](https://etherscan.io/token/0xdAC17F958D2ee523a2206206994597C13D831ec7) |
| Target Wallet | `0x1FF7251B479818d0529b65d89AD314E47E5DA922` | [View on Etherscan](https://etherscan.io/address/0x1FF7251B479818d0529b65d89AD314E47E5DA922) |

---

## Settlement Parameters

| Parameter | Value |
|-----------|-------|
| Network | Ethereum Mainnet (Chain ID: 1) |
| Stablecoin Claim Amount | 100 USDC or 100 USDT |
| SGE Reward per Claim | 1,000 SGE |
| Gas Buffer | 0.005 ETH reserved for transaction fees |
| Block Confirmations | 1 |
| Safety Countdown | 5 seconds before execution |
| Token Standard | ERC-20 |

---

## Safety Features

| Feature | Description |
|---------|-------------|
| **Chain verification** | Aborts if not connected to Ethereum Mainnet (Chain ID 1) |
| **Balance validation** | Checks sender has enough ETH (including gas buffer) and SGE before executing |
| **5-second countdown** | Ctrl+C window to abort before any transaction is sent |
| **No hardcoded keys** | Reads from `.env.local` which is git-ignored |
| **Transaction receipts** | Waits for on-chain confirmation before reporting success |
| **Etherscan links** | Every transaction hash and wallet links directly to the block explorer |

---

## Demo Mode (Optional)

The repo includes a browser-based demo UI that simulates the settlement flow visually without executing real transactions. Deployed at:

**https://fthtrading.github.io/sge-alignment-os/home**

Demo flow: `/home` → "Activate Your Position" → `/activate` → 3-phase settlement simulation → `/activation-dashboard`

To run locally:
```bash
cd apps/web
echo "NEXT_PUBLIC_DEMO_MODE=true" >> .env.local
pnpm dev
# Visit http://localhost:3000/activate
```

---

## License

**Proprietary Software — SGE Foundation.**
Modification, distribution, or external use without written consent is strictly prohibited.
