# MetaMask Card — Integration Review

> **Last Updated:** 2026-03-17
> **Status:** Routing & readiness layer only — no direct card issuance

---

## Official Product Summary

MetaMask Card is an official MetaMask (Consensys) product that allows users to spend designated crypto assets anywhere Mastercard is accepted. The card converts crypto to fiat at the point of sale. Users retain full custody of their funds until the moment of purchase.

- **Product page:** <https://metamask.io/card>
- **Portfolio access:** <https://portfolio.metamask.io/card>
- **Support:** <https://support.metamask.io/manage-crypto/metamask-card/what-is-metamask-card>
- **Getting started:** <https://support.metamask.io/manage-crypto/metamask-card/getting-started-with-card>

---

## Official Support Matrix

### Regions

| Region        | Status        | Notes                                      |
| ------------- | ------------- | ------------------------------------------ |
| United States | ✅ Available  | Virtual + Metal card tiers                  |
| EU / EEA      | ✅ Available  | Virtual card, region-specific restrictions  |
| UK            | ✅ Available  | Virtual card                                |
| Other         | ⏳ Expanding  | Waitlist available in some markets          |

> Region availability changes frequently. Always check the official MetaMask Card page.

### Supported Networks

| Network  | Status       |
| -------- | ------------ |
| Linea    | ✅ Supported |
| Solana   | ✅ Supported |
| Monad    | ✅ Supported |
| Base     | ✅ Supported |
| Ethereum | ⚠️ Check official docs for current status |

### Supported Tokens

| Token | Networks         | Notes                    |
| ----- | ---------------- | ------------------------ |
| USDC  | Multiple         | Primary stablecoin       |
| USDT  | Multiple         | Supported stablecoin     |
| ETH   | Linea, Ethereum  | Native asset             |
| SOL   | Solana           | Native asset             |
| Others| Various          | Check MetaMask docs      |

### Card Tiers

| Tier          | Region | Features                                    |
| ------------- | ------ | ------------------------------------------- |
| Virtual Card  | Global | Instant issuance, Apple Pay, Google Pay      |
| Metal Card    | US     | Physical Mastercard, premium tier            |

### Promotions & Perks

- **Blackbird Dining:** MetaMask Card holders get special dining benefits via Blackbird partnership (announced March 2026).
  - Source: <https://metamask.io/news/metamask-card-blackbird-dining-benefits>
- Additional cashback/rewards programs may exist — check official docs.

---

## What Our System Can Do

| Capability                          | Status | Implementation                           |
| ----------------------------------- | ------ | ---------------------------------------- |
| Detect MetaMask wallet              | ✅     | Check `window.ethereum.isMetaMask`       |
| Connect MetaMask & read address     | ✅     | Standard `eth_requestAccounts`           |
| Check connected network/chain ID    | ✅     | `eth_chainId`                            |
| Read stablecoin balances            | ✅     | ERC-20 `balanceOf` calls                 |
| Determine card-compatible assets    | ✅     | Client-side config check                 |
| Show eligibility based on region    | ✅     | Config-driven UI (user self-selects)     |
| Display supported networks/tokens   | ✅     | Static config, easily updatable          |
| Link to official MetaMask Card page | ✅     | External deep links                      |
| Link to MetaMask Card onboarding    | ✅     | External deep links                      |
| Show "Card Ready" badge             | ✅     | If wallet has supported assets on supported network |
| Suggest bridging/swapping           | ✅     | Informational prompts                    |

## What Our System Cannot Do

| Capability                          | Status | Reason                                   |
| ----------------------------------- | ------ | ---------------------------------------- |
| Issue or mint MetaMask Card         | ❌     | MetaMask/Consensys proprietary product   |
| Enroll users into card program      | ❌     | Requires official partner API access     |
| Process card transactions           | ❌     | Mastercard rails controlled by MetaMask  |
| Read card status or spend limits    | ❌     | No public API available                  |
| Access card analytics or data       | ❌     | Proprietary MetaMask Portfolio data      |
| Bridge tokens on behalf of user     | ❌     | User must use their own wallet           |

## What Requires Official MetaMask Partnership

| Capability                          | Partnership Type                 |
| ----------------------------------- | -------------------------------- |
| Direct card issuance API            | Formal Consensys partnership     |
| Embedded card onboarding widget     | MetaMask SDK / Partner program   |
| Transaction-level spending data     | Data sharing agreement           |
| Co-branded card product             | Mastercard + Consensys agreement |
| Custom rewards/cashback programs    | Official partner program         |

---

## Recommended Future Integration Paths

1. **MetaMask SDK Integration:** If/when MetaMask exposes a Card SDK, integrate the onboarding widget directly into the SGE app.
2. **Consensys Partner Program:** Apply for partner access to get deeper card API integration.
3. **Linea L2 Strategy:** Since Linea is a supported card network and a Consensys product, prioritizing SGE token/stablecoin availability on Linea could create a natural card-ready experience.
4. **Snap/Extension:** Build a MetaMask Snap that provides SGE-specific balance and claim information natively inside MetaMask.

---

## Architecture Stance

Our application builds a **readiness + routing layer**, not a fake issuance layer:

```
┌─────────────────────────────────┐
│  SGE App — MetaMask Card Module │
│                                 │
│  ┌─────────────────────┐        │
│  │ Wallet Detection    │        │
│  │ Balance Checks      │────────┼──── On-chain reads (our code)
│  │ Network Detection   │        │
│  │ Eligibility UI      │        │
│  └─────────────────────┘        │
│                                 │
│  ┌─────────────────────┐        │
│  │ Official Links      │        │
│  │ Onboarding Guide    │────────┼──── Deep links to metamask.io (external)
│  │ Waitlist CTA        │        │
│  │ Benefits Display    │        │
│  └─────────────────────┘        │
│                                 │
│  ┌─────────────────────┐        │
│  │ Card Ready Badge    │        │
│  │ Bridge Suggestions  │────────┼──── Informational only (no automation)
│  │ Swap Suggestions    │        │
│  └─────────────────────┘        │
└─────────────────────────────────┘
```

This keeps the product honest, useful, and legally clean.
