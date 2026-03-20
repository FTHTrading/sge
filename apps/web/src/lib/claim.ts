// ╔═══════════════════════════════════════════════════════════════╗
// ║  ⛔ STALE ABI — DO NOT IMPORT THIS FILE                     ║
// ║                                                             ║
// ║  This module contains a STALE ABI (includes `claimSGE()`   ║
// ║  which does NOT exist on-chain). It also lacks the          ║
// ║  `hasClaimed()` eligibility check present in the corrected  ║
// ║  module.                                                    ║
// ║                                                             ║
// ║  Use instead:                                               ║
// ║    @/lib/web3/sgeClaim   — verified ABI, full flow          ║
// ║    @/lib/web3/erc20      — ERC-20 helpers                   ║
// ║    @/lib/config/sge      — addresses, constants, URLs       ║
// ║                                                             ║
// ║  See docs/sge/TRUTH-PASS.md for evidence chain.             ║
// ╚═══════════════════════════════════════════════════════════════╝

// Hard-kill in live mode: if any remaining code accidentally imports this,
// it will throw immediately rather than silently use the wrong ABI.
if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
  throw new Error(
    "[FATAL] @/lib/claim.ts is DEPRECATED and contains a stale ABI. " +
    "Import @/lib/web3/sgeClaim instead. See docs/sge/TRUTH-PASS.md."
  );
}

// ─────────────────────────────────────────────
// SGE Alignment OS – Onchain Claim Service (DEPRECATED)
// ─────────────────────────────────────────────
// Handles wallet connection, ERC-20 approval, claim execution,
// transaction receipt polling, and explorer link generation.
// Uses ethers.js v6 via window.ethereum (MetaMask / injected provider).
// ─────────────────────────────────────────────

/* ──────────────────  CONSTANTS  ────────────────── */

export const ETHEREUM_MAINNET_CHAIN_ID = 1;

export const SGE_CLAIM_CONTRACT = "0x4BFeF695a5f85a65E1Aa6015439f317494477D09";

export const TOKENS = {
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    symbol: "USDT",
    decimals: 6,
  },
} as const;

export type TokenSymbol = keyof typeof TOKENS;

/** Raw approval amount: 100_000_000 (100 tokens at 6 decimals) */
export const CLAIM_AMOUNT_RAW = "100000000";
export const CLAIM_AMOUNT_HUMAN = 100;
export const SGE_PAYOUT = 1000;

/* ──────────────────  ABIs  ────────────────── */

/** Minimal ERC-20 ABI — only what we need */
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
] as const;

/** SGEClaim contract ABI */
const SGE_CLAIM_ABI = [
  "function claimWithUSDC() external",
  "function claimWithUSDT() external",
  "function claimSGE() external",
] as const;

/* ──────────────────  TYPES  ────────────────── */

export type ClaimStep =
  | "idle"
  | "connecting"
  | "checking_network"
  | "checking_balance"
  | "approving"
  | "approval_pending"
  | "claiming"
  | "claim_pending"
  | "confirmed"
  | "failed";

export interface ClaimState {
  step: ClaimStep;
  walletAddress: string | null;
  selectedToken: TokenSymbol | null;
  approveTxHash: string | null;
  claimTxHash: string | null;
  error: string | null;
}

export const INITIAL_CLAIM_STATE: ClaimState = {
  step: "idle",
  walletAddress: null,
  selectedToken: null,
  approveTxHash: null,
  claimTxHash: null,
  error: null,
};

/* ──────────────────  HELPERS  ────────────────── */

function getEthereum(): any {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

export function explorerTxUrl(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ──────────────────  PROVIDER  ────────────────── */

async function getProvider() {
  const { BrowserProvider } = await import("ethers");
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.");
  return new BrowserProvider(ethereum);
}

async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

/* ──────────────────  WALLET CONNECTION  ────────────────── */

export async function connectWallet(): Promise<string> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.");
  const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts.length) throw new Error("No accounts returned from wallet.");
  return accounts[0]!;
}

export async function getChainId(): Promise<number> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet detected.");
  const hex: string = await ethereum.request({ method: "eth_chainId" });
  return parseInt(hex, 16);
}

export async function switchToMainnet(): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error("No wallet detected.");
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x1" }],
  });
}

/* ──────────────────  ERC-20 HELPERS  ────────────────── */

export async function getTokenBalance(
  tokenSymbol: TokenSymbol,
  walletAddress: string
): Promise<bigint> {
  const { Contract } = await import("ethers");
  const token = TOKENS[tokenSymbol];
  const provider = await getProvider();
  const contract = new Contract(token.address, ERC20_ABI, provider);
  return (contract.balanceOf as Function)(walletAddress);
}

export async function getAllowance(
  tokenSymbol: TokenSymbol,
  walletAddress: string
): Promise<bigint> {
  const { Contract } = await import("ethers");
  const token = TOKENS[tokenSymbol];
  const provider = await getProvider();
  const contract = new Contract(token.address, ERC20_ABI, provider);
  return (contract.allowance as Function)(walletAddress, SGE_CLAIM_CONTRACT);
}

export async function approveToken(tokenSymbol: TokenSymbol): Promise<string> {
  const { Contract } = await import("ethers");
  const token = TOKENS[tokenSymbol];
  const signer = await getSigner();
  const contract = new Contract(token.address, ERC20_ABI, signer);
  const tx = await (contract.approve as Function)(SGE_CLAIM_CONTRACT, CLAIM_AMOUNT_RAW);
  return tx.hash;
}

/* ──────────────────  CLAIM EXECUTION  ────────────────── */

export async function executeClaim(tokenSymbol: TokenSymbol): Promise<string> {
  const { Contract } = await import("ethers");
  const signer = await getSigner();
  const contract = new Contract(SGE_CLAIM_CONTRACT, SGE_CLAIM_ABI, signer);

  let tx: any;
  if (tokenSymbol === "USDC") {
    tx = await (contract.claimWithUSDC as Function)();
  } else if (tokenSymbol === "USDT") {
    tx = await (contract.claimWithUSDT as Function)();
  } else {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }
  return tx.hash;
}

/* ──────────────────  TX RECEIPT POLLING  ────────────────── */

export async function waitForReceipt(
  txHash: string,
  confirmations = 1,
  timeoutMs = 120_000
): Promise<{ blockNumber: number; status: number }> {
  const provider = await getProvider();
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && (await receipt.confirmations()) >= confirmations) {
      return { blockNumber: receipt.blockNumber, status: receipt.status ?? 0 };
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("Transaction confirmation timed out.");
}

/* ──────────────────  FULL CLAIM FLOW  ────────────────── */

export type ClaimProgressCallback = (state: Partial<ClaimState>) => void;

/**
 * Orchestrates the full claim flow:
 * 1. Connect wallet
 * 2. Verify Ethereum Mainnet
 * 3. Check token balance
 * 4. Approve token spending
 * 5. Execute claim
 * 6. Wait for confirmation
 */
export async function runClaimFlow(
  tokenSymbol: TokenSymbol,
  onProgress: ClaimProgressCallback
): Promise<{ claimTxHash: string; approveTxHash: string; blockNumber: number }> {
  try {
    // Step 1: Connect
    onProgress({ step: "connecting" });
    const wallet = await connectWallet();
    onProgress({ walletAddress: wallet });

    // Step 2: Check network
    onProgress({ step: "checking_network" });
    const chainId = await getChainId();
    if (chainId !== ETHEREUM_MAINNET_CHAIN_ID) {
      await switchToMainnet();
      // Verify switch succeeded
      const newChainId = await getChainId();
      if (newChainId !== ETHEREUM_MAINNET_CHAIN_ID) {
        throw new Error("Please switch to Ethereum Mainnet to continue.");
      }
    }

    // Step 3: Check balance
    onProgress({ step: "checking_balance" });
    const balance = await getTokenBalance(tokenSymbol, wallet);
    const required = BigInt(CLAIM_AMOUNT_RAW);
    if (balance < required) {
      const token = TOKENS[tokenSymbol];
      const humanBalance = Number(balance) / Math.pow(10, token.decimals);
      throw new Error(
        `Insufficient ${tokenSymbol} balance. You have ${humanBalance.toFixed(2)} but need ${CLAIM_AMOUNT_HUMAN}.`
      );
    }

    // Step 4: Check allowance & approve if needed
    const currentAllowance = await getAllowance(tokenSymbol, wallet);
    let approveTxHash: string;
    if (currentAllowance < required) {
      onProgress({ step: "approving" });
      approveTxHash = await approveToken(tokenSymbol);
      onProgress({ step: "approval_pending", approveTxHash });
      const approveResult = await waitForReceipt(approveTxHash);
      if (approveResult.status === 0) throw new Error("Approval transaction reverted.");
    } else {
      approveTxHash = "already-approved";
    }

    // Step 5: Execute claim
    onProgress({ step: "claiming" });
    const claimTxHash = await executeClaim(tokenSymbol);
    onProgress({ step: "claim_pending", claimTxHash });

    // Step 6: Wait for confirmation
    const claimResult = await waitForReceipt(claimTxHash);
    if (claimResult.status === 0) throw new Error("Claim transaction reverted on-chain.");

    onProgress({ step: "confirmed" });
    return { claimTxHash, approveTxHash, blockNumber: claimResult.blockNumber };
  } catch (err: any) {
    const message = err?.reason ?? err?.message ?? "Unknown error";
    onProgress({ step: "failed", error: message });
    throw err;
  }
}
