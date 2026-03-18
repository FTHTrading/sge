// ─────────────────────────────────────────────
// Settlement Engine — Type Definitions
// ─────────────────────────────────────────────

export type PaymentToken = "USDC" | "USDT";
export type SettlementStatus = "confirmed" | "failed" | "pending_reconciliation";
export type LegType = "treasury" | "reserve" | "fee" | "community";

export interface AllocationLeg {
  type: LegType;
  percentage: number;
  amountRaw: string;
  amountHuman: number;
  destinationLabel: string;
}

export interface SettlementRecord {
  id: string;
  walletAddress: string;
  paymentToken: PaymentToken;
  paymentAmountRaw: string;
  paymentAmountHuman: number;
  claimTxHash: string;
  claimBlockNumber: number;
  claimTimestamp: Date;
  claimStatus: SettlementStatus;
  sgeAmountExpected: number;
  sgeAmountDelivered: number | null;
  allocations: AllocationLeg[];
  reconciledAt: Date | null;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  settlementId: string;
  legType: LegType;
  direction: "credit";
  token: PaymentToken;
  amountRaw: string;
  amountHuman: number;
  memo: string;
  createdAt: Date;
}

export interface SettlementConfig {
  treasuryPercent: number;
  reservePercent: number;
  feePercent: number;
  communityPercent: number;
}

export interface ReconciliationResult {
  processed: number;
  created: number;
  verified: number;
  flagged: number;
  errors: string[];
}

export const DEFAULT_ALLOCATION: SettlementConfig = {
  treasuryPercent: 70,
  reservePercent: 15,
  feePercent: 10,
  communityPercent: 5,
};

export const LEG_LABELS: Record<LegType, string> = {
  treasury: "SGE Foundation Treasury",
  reserve: "Strategic Reserve",
  fee: "Platform Operations",
  community: "Community Fund",
};
