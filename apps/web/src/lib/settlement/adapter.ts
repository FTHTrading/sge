// ─────────────────────────────────────────────
// Settlement Adapter — unified service layer
// ─────────────────────────────────────────────
// Single adapter providing all wallet, token, and settlement operations.
// Supports DEMO_MODE for safe visual simulation.

import { SGE_CONFIG, type SGETokenSymbol, explorerTxUrl, explorerAddressUrl } from "@/lib/config/sge";
import { DEMO_MODE, DEMO_DELAYS, DEMO_WALLET, DEMO_TX } from "@/lib/config/demo";

// ── Types ───────────────────────────────────

export type ActivationStep =
  | "idle"
  | "connecting"
  | "checking_network"
  | "checking_eligibility"
  | "checking_balance"
  | "approval_needed"
  | "approving"
  | "approval_pending"
  | "ready_to_activate"
  | "activating"
  | "settled"
  | "failed";

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  correctChain: boolean;
}

export interface TokenState {
  symbol: SGETokenSymbol;
  balance: string;
  balanceRaw: bigint;
  allowance: string;
  allowanceRaw: bigint;
  approvalRequired: boolean;
}

export interface SettlementSummary {
  wallet: string;
  tokenPaid: string;
  amountPaid: string;
  sgeReceived: string;
  approveTxHash: string | null;
  claimTxHash: string;
  blockNumber: number;
  settlementConfirmed: boolean;
  explorerLink: string;
  walletExplorerLink: string;
  timestamp: Date;
}

export type ActivationProgressCallback = (update: {
  step: ActivationStep;
  walletState?: WalletState;
  tokenState?: TokenState;
  approveTxHash?: string;
  claimTxHash?: string;
  settlement?: SettlementSummary;
  error?: string;
}) => void;

// ── Demo helpers ────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Wallet ──────────────────────────────────

export async function getWalletState(): Promise<WalletState> {
  if (DEMO_MODE) {
    return {
      connected: true,
      address: DEMO_WALLET.address,
      chainId: 1,
      correctChain: true,
    };
  }

  const ethereum = (window as any).ethereum;
  if (!ethereum) {
    return { connected: false, address: null, chainId: null, correctChain: false };
  }

  try {
    const accounts: string[] = await ethereum.request({ method: "eth_accounts" });
    const chainHex: string = await ethereum.request({ method: "eth_chainId" });
    const chainId = parseInt(chainHex, 16);
    return {
      connected: accounts.length > 0,
      address: accounts[0] ?? null,
      chainId,
      correctChain: chainId === SGE_CONFIG.chainId,
    };
  } catch {
    return { connected: false, address: null, chainId: null, correctChain: false };
  }
}

export async function connectWallet(): Promise<string> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.connectWallet);
    return DEMO_WALLET.address;
  }

  const { connectWallet: realConnect } = await import("@/lib/web3/sgeClaim");
  return realConnect();
}

export async function ensureCorrectChain(): Promise<void> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.checkNetwork);
    return;
  }

  const { getChainId, switchToMainnet } = await import("@/lib/web3/sgeClaim");
  const chainId = await getChainId();
  if (chainId !== SGE_CONFIG.chainId) {
    await switchToMainnet();
    const newChainId = await getChainId();
    if (newChainId !== SGE_CONFIG.chainId) {
      throw new Error("Please switch to Ethereum Mainnet to continue.");
    }
  }
}

// ── Token ───────────────────────────────────

export async function getTokenBalance(
  token: SGETokenSymbol,
  wallet: string
): Promise<{ raw: bigint; human: string }> {
  if (DEMO_MODE) {
    const balStr = token === "USDC" ? DEMO_WALLET.usdcBalance : DEMO_WALLET.usdtBalance;
    const raw = BigInt(Math.round(parseFloat(balStr) * 1e6));
    return { raw, human: balStr };
  }

  const { getTokenBalance: realBalance } = await import("@/lib/web3/erc20");
  const raw = await realBalance(token, wallet);
  const decimals = SGE_CONFIG.tokens[token].decimals;
  const human = (Number(raw) / Math.pow(10, decimals)).toFixed(2);
  return { raw, human };
}

export async function getAllowance(
  token: SGETokenSymbol,
  wallet: string
): Promise<{ raw: bigint; human: string }> {
  if (DEMO_MODE) {
    return { raw: 0n, human: "0.00" };
  }

  const { getAllowance: realAllowance } = await import("@/lib/web3/erc20");
  const raw = await realAllowance(token, wallet);
  const decimals = SGE_CONFIG.tokens[token].decimals;
  const human = (Number(raw) / Math.pow(10, decimals)).toFixed(2);
  return { raw, human };
}

export async function approveToken(
  token: SGETokenSymbol,
  amount: string = SGE_CONFIG.defaultApprovalAmount
): Promise<string> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.approve);
    return DEMO_TX.approveTxHash;
  }

  const { approveToken: realApprove } = await import("@/lib/web3/erc20");
  return realApprove(token, amount);
}

// ── Activation / Claim ──────────────────────

export async function checkEligibility(wallet: string): Promise<boolean> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.checkEligibility);
    return true; // eligible in demo
  }

  const { hasClaimed } = await import("@/lib/web3/sgeClaim");
  const claimed = await hasClaimed(wallet);
  return !claimed;
}

export async function executeActivation(token: SGETokenSymbol): Promise<string> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.claim);
    return DEMO_TX.claimTxHash;
  }

  const { executeClaim } = await import("@/lib/web3/sgeClaim");
  return executeClaim(token);
}

export async function waitForSettlement(txHash: string): Promise<{ blockNumber: number; status: number }> {
  if (DEMO_MODE) {
    await delay(DEMO_DELAYS.claimConfirm);
    return { blockNumber: DEMO_TX.blockNumber, status: 1 };
  }

  const { waitForReceipt } = await import("@/lib/web3/sgeClaim");
  return waitForReceipt(txHash);
}

export function formatSettlementSummary(params: {
  wallet: string;
  token: SGETokenSymbol;
  amount: string;
  claimTxHash: string;
  approveTxHash: string | null;
  blockNumber: number;
}): SettlementSummary {
  return {
    wallet: params.wallet,
    tokenPaid: params.token,
    amountPaid: `${SGE_CONFIG.claimAmountHuman} ${params.token}`,
    sgeReceived: `${SGE_CONFIG.sgeReward.toLocaleString()} SGE`,
    approveTxHash: params.approveTxHash,
    claimTxHash: params.claimTxHash,
    blockNumber: params.blockNumber,
    settlementConfirmed: true,
    explorerLink: explorerTxUrl(params.claimTxHash),
    walletExplorerLink: explorerAddressUrl(params.wallet),
    timestamp: new Date(),
  };
}

// ── Full Orchestrated Flow ──────────────────

export async function runActivationFlow(
  token: SGETokenSymbol,
  onProgress: ActivationProgressCallback
): Promise<SettlementSummary> {
  try {
    // 1. Connect
    onProgress({ step: "connecting" });
    const wallet = await connectWallet();
    const walletState: WalletState = {
      connected: true,
      address: wallet,
      chainId: SGE_CONFIG.chainId,
      correctChain: true,
    };
    onProgress({ step: "connecting", walletState });

    // 2. Network check
    onProgress({ step: "checking_network", walletState });
    await ensureCorrectChain();

    // 3. Eligibility
    onProgress({ step: "checking_eligibility", walletState });
    const eligible = await checkEligibility(wallet);
    if (!eligible) {
      throw new Error("This wallet has already activated its foundational position.");
    }

    // 4. Balance
    onProgress({ step: "checking_balance", walletState });
    const balance = await getTokenBalance(token, wallet);
    const required = BigInt(SGE_CONFIG.claimAmountRaw);
    if (balance.raw < required) {
      throw new Error(
        `Insufficient ${token} balance. You have ${balance.human} but need ${SGE_CONFIG.claimAmountHuman}.`
      );
    }

    // 5. Allowance check
    const allowance = await getAllowance(token, wallet);
    const tokenState: TokenState = {
      symbol: token,
      balance: balance.human,
      balanceRaw: balance.raw,
      allowance: allowance.human,
      allowanceRaw: allowance.raw,
      approvalRequired: allowance.raw < required,
    };

    let approveTxHash: string | null = null;

    if (tokenState.approvalRequired) {
      onProgress({ step: "approval_needed", walletState, tokenState });

      // Wait for user to click approve — this is handled by the UI
      // The UI calls approveToken separately and then re-runs
      onProgress({ step: "approving", walletState, tokenState });
      approveTxHash = await approveToken(token);
      onProgress({ step: "approval_pending", walletState, tokenState, approveTxHash });

      if (!DEMO_MODE) {
        const approveResult = await waitForSettlement(approveTxHash);
        if (approveResult.status === 0) throw new Error("Approval transaction reverted.");
      } else {
        await delay(DEMO_DELAYS.approvalConfirm);
      }

      // Update token state
      tokenState.approvalRequired = false;
      tokenState.allowance = SGE_CONFIG.claimAmountHuman.toString();
      tokenState.allowanceRaw = required;
    }

    onProgress({ step: "ready_to_activate", walletState, tokenState });

    // 6. Execute activation
    onProgress({ step: "activating", walletState, tokenState });
    const claimTxHash = await executeActivation(token);
    onProgress({ step: "activating", walletState, tokenState, claimTxHash });

    // 7. Wait for settlement
    const receipt = await waitForSettlement(claimTxHash);
    if (receipt.status === 0) throw new Error("Activation transaction reverted on-chain.");

    // 8. Format summary
    const summary = formatSettlementSummary({
      wallet,
      token,
      amount: SGE_CONFIG.claimAmountRaw,
      claimTxHash,
      approveTxHash,
      blockNumber: receipt.blockNumber,
    });

    onProgress({ step: "settled", walletState, tokenState, claimTxHash, approveTxHash: approveTxHash ?? undefined, settlement: summary });
    return summary;

  } catch (err: any) {
    const message =
      err?.info?.error?.message ??
      err?.reason ??
      err?.message ??
      "Unknown error";
    onProgress({ step: "failed", error: message });
    throw err;
  }
}
