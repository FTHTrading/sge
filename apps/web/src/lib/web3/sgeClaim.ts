// ─────────────────────────────────────────────
// SGE Claim Contract — typed ethers v6 wrapper
// ─────────────────────────────────────────────
// ABI verified via runtime truth pass (eth_call probing against mainnet bytecode).
// Contract is NOT verified on Etherscan — selectors confirmed by keccak256 brute-force.
// See docs/sge/TRUTH-PASS.md for full evidence chain.

import { SGE_CONFIG, type SGETokenSymbol } from "@/lib/config/sge";

/**
 * SGE Claim contract ABI — VERIFIED selectors only.
 *
 * Confirmed on-chain:
 *   owner()             0x8da5cb5b  ✅
 *   usdcToken()         0x11eac855  ✅
 *   usdtToken()         0xa98ad46c  ✅
 *   sgeToken()          0x3ab2fa02  ✅
 *   hasClaimed(address) 0x73b2e80e  ✅
 *   claimWithUSDC()     0xf9d6d8b6  ✅
 *   claimWithUSDT()     0x84910e5c  ✅
 *   CLAIM_AMOUNT()      0x270ef385  ✅  returns 1000 × 10¹⁸ (SGE reward)
 *   fundSGE(uint256)    0x43b8c825  ✅  owner-only
 *
 * NOT on-chain (removed from prior assumed ABI):
 *   paused(), claimAmount(), sgeReward(), treasury(), claimSGE(),
 *   pause(), unpause(), setClaimAmount(), setSgeReward(), setTreasury(), withdrawTokens()
 *
 * Event signature is UNVERIFIED — no decoded event logs available from chain history.
 */
const SGE_CLAIM_ABI = [
  // ── Write ──
  "function claimWithUSDC() external",
  "function claimWithUSDT() external",
  "function fundSGE(uint256 amount) external",
  // ── Read ──
  "function hasClaimed(address wallet) external view returns (bool)",
  "function CLAIM_AMOUNT() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function usdcToken() external view returns (address)",
  "function usdtToken() external view returns (address)",
  "function sgeToken() external view returns (address)",
  // ── Ownable ──
  "function renounceOwnership() external",
  "function transferOwnership(address newOwner) external",
  // ── Event (UNVERIFIED — param names/indexing assumed) ──
  "event Claimed(address indexed wallet, address token, uint256 amount, uint256 sgeAmount)",
] as const;

async function getProvider() {
  const { BrowserProvider } = await import("ethers");
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.");
  return new BrowserProvider(ethereum);
}

async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

function getContract(signerOrProvider: any) {
  const { Contract } = require("ethers");
  return new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, signerOrProvider);
}

/* ──────────────── READ-ONLY ──────────────── */

/** Check if wallet has already claimed */
export async function hasClaimed(walletAddress: string): Promise<boolean> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.hasClaimed as Function)(walletAddress);
}

/**
 * Read the CLAIM_AMOUNT constant from the contract.
 * Returns the SGE reward per claim in raw wei (1000 × 10¹⁸).
 */
export async function readClaimAmountRaw(): Promise<bigint> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.CLAIM_AMOUNT as Function)();
}

/** Read contract owner */
export async function readOwner(): Promise<string> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.owner as Function)();
}

/** Read the SGE token address stored in the contract */
export async function readSgeToken(): Promise<string> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.sgeToken as Function)();
}

/** Read the USDC token address stored in the contract */
export async function readUsdcToken(): Promise<string> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.usdcToken as Function)();
}

/** Read the USDT token address stored in the contract */
export async function readUsdtToken(): Promise<string> {
  const { Contract } = await import("ethers");
  const provider = await getProvider();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, provider);
  return (contract.usdtToken as Function)();
}
/** Check if the contract actually has enough SGE to fulfill a claim */
export async function checkContractFundedStatus(): Promise<{ isFunded: boolean, balanceStr: string }> {
  try {
    const { Contract, formatUnits } = await import("ethers");
    const provider = await getProvider();
    
    // ABI just for checking SGE token balance
    const erc20Abi = ["function balanceOf(address account) view returns (uint256)"];
    const sgeTokenContract = new Contract(SGE_CONFIG.sgeToken, erc20Abi, provider);
    
    // Cast to any to bypass strict typing for dynamically created contract methods
    const balanceWei: bigint = await (sgeTokenContract as any).balanceOf(SGE_CONFIG.claimContract);
    
    // We assume 18 decimals for SGE based on the CLAIM_AMOUNT of 1000 * 10^18
    const balanceHuman = Number(formatUnits(balanceWei, 18));
    
    // If the contract has less than the reward amount, it is drained
    return {
      isFunded: balanceHuman >= SGE_CONFIG.sgeReward,
      balanceStr: balanceHuman.toLocaleString()
    };
  } catch (err) {
    console.error("Failed to check contract balance", err);
    // Be conservative - if we can't check, assume it might not be funded, but returning false blocks UI.
    // Return true by default so the UI doesn't lock up if RPC is sluggish, letting the tx itself revert if needed,
    // OR we return false to strictly lock it. Given 'drained' is confirmed, strictly locking it is safer.
    return { isFunded: false, balanceStr: "0" };
  }
}
/* ──────────────── WRITE ──────────────── */

/** Execute the claim for a specific token */
export async function executeClaim(token: SGETokenSymbol): Promise<string> {
  const { Contract } = await import("ethers");
  const signer = await getSigner();
  const contract = new Contract(SGE_CONFIG.claimContract, SGE_CLAIM_ABI, signer);

  let tx: any;
  if (token === "USDC") {
    tx = await (contract.claimWithUSDC as Function)();
  } else if (token === "USDT") {
    tx = await (contract.claimWithUSDT as Function)();
  } else {
    throw new Error(`Unsupported token: ${token}`);
  }
  return tx.hash as string;
}

/* ──────────────── TX RECEIPT ──────────────── */

/** Poll for transaction receipt with timeout */
export async function waitForReceipt(
  txHash: string,
  confirmations = SGE_CONFIG.reconciliation.confirmations,
  timeoutMs = SGE_CONFIG.reconciliation.txTimeoutMs
): Promise<{ blockNumber: number; status: number }> {
  const provider = await getProvider();
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt && (await receipt.confirmations()) >= confirmations) {
      return { blockNumber: receipt.blockNumber, status: receipt.status ?? 0 };
    }
    await new Promise((r) => setTimeout(r, SGE_CONFIG.reconciliation.pollIntervalMs));
  }
  throw new Error("Transaction confirmation timed out.");
}

/* ──────────────── WALLET ──────────────── */

/** Request wallet connection via MetaMask / injected provider */
export async function connectWallet(): Promise<string> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected. Please install MetaMask.");
  const accounts: string[] = await ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts.length) throw new Error("No accounts returned from wallet.");
  return accounts[0]!;
}

/** Get current chain ID */
export async function getChainId(): Promise<number> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected.");
  const hex: string = await ethereum.request({ method: "eth_chainId" });
  return parseInt(hex, 16);
}

/** Switch to Ethereum Mainnet */
export async function switchToMainnet(): Promise<void> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error("No wallet detected.");
  await ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: `0x${SGE_CONFIG.chainId.toString(16)}` }],
  });
}

/** Detect if connected wallet is MetaMask specifically */
export function isMetaMask(): boolean {
  if (typeof window === "undefined") return false;
  const ethereum = (window as any).ethereum;
  return !!ethereum?.isMetaMask;
}

/** Shorten address for display */
export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/* ──────────────── FULL ORCHESTRATED FLOW ──────────────── */

export type ClaimStep =
  | "idle"
  | "connecting"
  | "checking_network"
  | "checking_eligibility"
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
  selectedToken: SGETokenSymbol | null;
  approveTxHash: string | null;
  claimTxHash: string | null;
  error: string | null;
  alreadyClaimed: boolean;
}

export const INITIAL_CLAIM_STATE: ClaimState = {
  step: "idle",
  walletAddress: null,
  selectedToken: null,
  approveTxHash: null,
  claimTxHash: null,
  error: null,
  alreadyClaimed: false,
};

export type ClaimProgressCallback = (state: Partial<ClaimState>) => void;

/** Orchestrate the full claim flow */
export async function runClaimFlow(
  token: SGETokenSymbol,
  onProgress: ClaimProgressCallback
): Promise<{ claimTxHash: string; approveTxHash: string; blockNumber: number }> {
  const { getAllowance, getTokenBalance, approveToken } = await import("@/lib/web3/erc20");

  try {
    // 1. Connect
    onProgress({ step: "connecting" });
    const wallet = await connectWallet();
    onProgress({ walletAddress: wallet });

    // 2. Network
    onProgress({ step: "checking_network" });
    const chainId = await getChainId();
    if (chainId !== SGE_CONFIG.chainId) {
      await switchToMainnet();
      const newChainId = await getChainId();
      if (newChainId !== SGE_CONFIG.chainId) {
        throw new Error("Please switch to Ethereum Mainnet to continue.");
      }
    }

    // 3. Eligibility (has already claimed?)
    onProgress({ step: "checking_eligibility" });
    const claimed = await hasClaimed(wallet);
    if (claimed) {
      onProgress({ alreadyClaimed: true });
      throw new Error("This wallet has already claimed SGE tokens.");
    }

    // 4. Balance
    onProgress({ step: "checking_balance" });
    const balance = await getTokenBalance(token, wallet);
    const required = BigInt(SGE_CONFIG.claimAmountRaw);
    if (balance < required) {
      const cfg = SGE_CONFIG.tokens[token];
      const humanBal = Number(balance) / Math.pow(10, cfg.decimals);
      throw new Error(
        `Insufficient ${token} balance. You have ${humanBal.toFixed(2)} but need ${SGE_CONFIG.claimAmountHuman}.`
      );
    }

    // 5. Approve
    const currentAllowance = await getAllowance(token, wallet);
    let approveTxHash: string;
    if (currentAllowance < required) {
      onProgress({ step: "approving" });
      approveTxHash = await approveToken(token);
      onProgress({ step: "approval_pending", approveTxHash });
      const approveResult = await waitForReceipt(approveTxHash);
      if (approveResult.status === 0) throw new Error("Approval transaction reverted.");
    } else {
      approveTxHash = "already-approved";
    }

    // 6. Claim
    onProgress({ step: "claiming" });
    const claimTxHash = await executeClaim(token);
    onProgress({ step: "claim_pending", claimTxHash });

    // 7. Confirm
    const claimResult = await waitForReceipt(claimTxHash);
    if (claimResult.status === 0) throw new Error("Claim transaction reverted on-chain.");

    onProgress({ step: "confirmed" });
    return { claimTxHash, approveTxHash, blockNumber: claimResult.blockNumber };
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
