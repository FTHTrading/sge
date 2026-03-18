// ─────────────────────────────────────────────
// Demo Mode Configuration
// ─────────────────────────────────────────────
// When DEMO_MODE is true, the system simulates approval/settlement
// flows visually without executing real on-chain transactions.
// Toggle via NEXT_PUBLIC_DEMO_MODE env var or this constant.

export const DEMO_MODE =
  typeof window !== "undefined"
    ? (window as any).__SGE_DEMO_MODE__ === true ||
      process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    : process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Simulated delays (ms) for demo mode */
export const DEMO_DELAYS = {
  connectWallet: 800,
  checkNetwork: 500,
  checkEligibility: 600,
  checkBalance: 400,
  approve: 1500,
  approvalConfirm: 2000,
  claim: 1800,
  claimConfirm: 2500,
} as const;

/** Demo wallet state */
export const DEMO_WALLET = {
  address: "0x1FF7251B479818d0529b65d89AD314E47E5DA922",
  ethBalance: "0.05",
  usdcBalance: "250.00",
  usdtBalance: "150.00",
  sgeBalance: "0",
} as const;

/** Demo transaction hashes */
export const DEMO_TX = {
  approveTxHash: "0xdemo_approve_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
  claimTxHash: "0xdemo_claim_f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1",
  blockNumber: 19_500_000,
} as const;
