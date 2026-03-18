# SGE Settlement Engine — Design Document

---

## Overview

The settlement engine provides a deterministic, internally atomic accounting layer that records every successful on-chain claim and breaks the incoming stablecoin payment into structured allocation legs.

Because the external SGE claim contract is a fixed, deployed, immutable smart contract, our system **cannot** make the on-chain transaction and the internal accounting truly atomic in a single database+blockchain operation. Instead, the architecture follows this model:

1. **On-chain transaction** — the user interacts directly with the SGE claim contract via their wallet.
2. **Post-transaction recording** — after the on-chain transaction is confirmed, our backend creates an internal settlement record atomically in a single database transaction.
3. **Reconciliation** — a separate idempotent reconciliation process verifies that every on-chain `Claimed` event has a matching internal settlement record and flags discrepancies.

---

## Boundary: Atomic vs. Sequenced

| Layer              | Atomic? | Notes                                                |
| ------------------ | ------- | ---------------------------------------------------- |
| On-chain claim tx  | Yes     | ERC-20 transfer + SGE distribution in one tx         |
| Internal recording | Yes     | Single Prisma transaction writes all ledger entries  |
| Cross-boundary     | **No**  | On-chain + internal recording are sequenced, not atomic |

**This means:** If the backend is offline when a claim confirms, the settlement record will be missing. The reconciliation engine catches and replays these.

---

## Settlement Record Schema

```typescript
interface SettlementRecord {
  id: string;                    // UUID
  walletAddress: string;         // Claimer
  paymentToken: "USDC" | "USDT";
  paymentAmountRaw: string;      // Raw uint256 string
  paymentAmountHuman: number;    // e.g. 100.00
  claimTxHash: string;           // On-chain tx hash
  claimBlockNumber: number;
  claimTimestamp: Date;
  claimStatus: "confirmed" | "failed" | "pending_reconciliation";
  sgeAmountExpected: number;     // e.g. 1000
  sgeAmountDelivered: number | null; // From event decoding if available
  allocations: AllocationLeg[];
  reconciledAt: Date | null;
  createdAt: Date;
}
```

---

## Allocation Legs

Every settlement is broken into four deterministic legs:

| Leg       | Default % | Purpose                                   |
| --------- | --------- | ----------------------------------------- |
| Treasury  | 70%       | Operational treasury                      |
| Reserve   | 15%       | Strategic reserve / compliance escrow     |
| Fee       | 10%       | Platform fee / operational costs          |
| Community | 5%        | Community fund / ecosystem grants         |

```typescript
interface AllocationLeg {
  type: "treasury" | "reserve" | "fee" | "community";
  percentage: number;           // 0-100
  amountRaw: string;            // Computed from payment
  amountHuman: number;
  destinationLabel: string;     // e.g. "SGE Foundation Treasury"
}
```

Percentages are configurable via admin panel and stored in app config. They must always sum to exactly 100%.

---

## Reconciliation Engine

### Purpose
Ensure every on-chain `Claimed` event has a corresponding internal settlement record.

### Process
1. **Poll phase:** Query recent blocks (or use event subscription) for `Claimed` events on the SGE contract.
2. **Match phase:** For each event, check if a settlement record with that `claimTxHash` exists.
3. **Create phase:** If missing, create the settlement record from on-chain data.
4. **Verify phase:** If exists, verify amounts match the on-chain event.
5. **Flag phase:** If amounts don't match, create a reconciliation alert.

### Idempotency
- The reconciliation engine uses `claimTxHash` as a unique key.
- Re-running reconciliation on the same block range produces the same result.
- No duplicates are created.

### Reprocessing
- Failed internal writes can be replayed via admin action.
- The admin panel has a "Replay Reconciliation" button for a specific tx hash or block range.

---

## Ledger Model

The ledger provides an append-only log of all financial movements:

```typescript
interface LedgerEntry {
  id: string;
  settlementId: string;
  legType: "treasury" | "reserve" | "fee" | "community";
  direction: "credit";          // Always credit for claim payments
  token: "USDC" | "USDT";
  amountRaw: string;
  amountHuman: number;
  memo: string;                 // Human-readable description
  createdAt: Date;
}
```

Ledger entries are immutable. Corrections are made with offsetting entries, never mutations.

---

## Data Flow

```
User Wallet
    │
    ▼
SGE Claim Contract (on-chain)
    │  Claimed event
    ▼
Backend / API listener
    │
    ▼
┌──────────────────────────────┐
│  Single DB Transaction       │
│  ┌────────────────────────┐  │
│  │ Settlement Record      │  │
│  │ Treasury Leg (70%)     │  │
│  │ Reserve Leg (15%)      │  │
│  │ Fee Leg (10%)          │  │
│  │ Community Leg (5%)     │  │
│  │ Ledger Entries (4x)    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
    │
    ▼
Reconciliation Engine (periodic)
    │
    ▼
Admin Dashboard (read-only view)
```

---

## Error Handling

| Scenario                          | Handling                                              |
| --------------------------------- | ----------------------------------------------------- |
| DB write fails after on-chain tx  | Reconciliation engine catches and replays              |
| Duplicate settlement attempt      | Unique constraint on `claimTxHash` prevents duplicates |
| Allocation % don't sum to 100     | Validation rejects config update                       |
| On-chain event has unexpected amt | Reconciliation flags as "needs review"                 |
| Network partition during poll     | Retry from last processed block with overlap           |

---

## Configuration

All settlement parameters are admin-configurable:

```typescript
interface SettlementConfig {
  treasuryPercent: number;     // Default: 70
  reservePercent: number;      // Default: 15
  feePercent: number;          // Default: 10
  communityPercent: number;    // Default: 5
  explorerBaseUrl: string;     // Default: "https://etherscan.io"
  claimContractAddress: string;
  usdcAddress: string;
  usdtAddress: string;
  defaultApprovalAmount: string; // Raw uint256
  reconciliationIntervalMs: number; // Default: 60000
}
```

---

## Future Considerations

1. **Webhook-based confirmation:** Replace polling with an Alchemy/Infura webhook for real-time event notification.
2. **Multi-chain support:** If SGE expands to L2s, add chain ID to settlement records.
3. **On-chain treasury routing:** If a future version of the claim contract supports split payments natively, the internal allocation layer can be made redundant.
4. **Audit trail:** All settlement operations are logged as `AuditEvent` entries with chained SHA-256 hashes for tamper evidence.
