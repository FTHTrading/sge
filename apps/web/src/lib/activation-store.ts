import type { SGETokenSymbol } from "@/lib/config/sge";

// ── Types ───────────────────────────────────

export interface ActivationRecord {
  wallet: string;
  token: SGETokenSymbol;
  amountPaid: number;
  sgeReceived: number;
  claimTxHash: string;
  approveTxHash: string | null;
  blockNumber: number;
  timestamp: string;
  activated: boolean;
}

export interface MonthlyClaimRecord {
  month: number;
  amount: number;
  status: "claimed" | "available" | "upcoming" | "locked";
  claimDate: string | null;
  txHash: string | null;
}

// ── Storage helpers ─────────────────────────

const STORAGE_KEY = "sge_activation_record";

export function loadActivationRecord(): ActivationRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActivationRecord(record: ActivationRecord): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
