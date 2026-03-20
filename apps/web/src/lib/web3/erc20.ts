// ─────────────────────────────────────────────
// ERC-20 Helpers — typed ethers v6 wrappers
// ─────────────────────────────────────────────

import { SGE_CONFIG, type SGETokenSymbol } from "@/lib/config/sge";

/** Minimal ERC-20 ABI — approve, allowance, balanceOf */
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
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

/** Read token balance for a wallet */
export async function getTokenBalance(
  token: SGETokenSymbol,
  walletAddress: string
): Promise<bigint> {
  const { Contract } = await import("ethers");
  const cfg = SGE_CONFIG.tokens[token];
  const provider = await getProvider();
  const contract = new Contract(cfg.address, ERC20_ABI, provider);
  return (contract.balanceOf as Function)(walletAddress);
}

/** Read current allowance for spender */
export async function getAllowance(
  token: SGETokenSymbol,
  walletAddress: string,
  spender: string = SGE_CONFIG.claimContract
): Promise<bigint> {
  const { Contract } = await import("ethers");
  const cfg = SGE_CONFIG.tokens[token];
  const provider = await getProvider();
  const contract = new Contract(cfg.address, ERC20_ABI, provider);
  return (contract.allowance as Function)(walletAddress, spender);
}

/** Approve spender for a given amount.
 *  USDT requires a zero-first approval pattern: if there is an existing
 *  non-zero allowance, we must first set it to 0 before setting the new value.
 *  See: https://github.com/Uniswap/interface/issues/7498
 */
export async function approveToken(
  token: SGETokenSymbol,
  amount: string = SGE_CONFIG.defaultApprovalAmount,
  spender: string = SGE_CONFIG.claimContract
): Promise<string> {
  const { Contract } = await import("ethers");
  const cfg = SGE_CONFIG.tokens[token];
  const signer = await getSigner();
  const contract = new Contract(cfg.address, ERC20_ABI, signer);

  // USDT requires resetting allowance to 0 before setting a new value
  if (token === "USDT") {
    const owner = await signer.getAddress();
    const provider = await getProvider();
    const readContract = new Contract(cfg.address, ERC20_ABI, provider);
    const currentAllowance: bigint = await (readContract.allowance as Function)(owner, spender);
    if (currentAllowance > 0n) {
      const resetTx = await (contract.approve as Function)(spender, 0);
      await resetTx.wait(1);
    }
  }

  const tx = await (contract.approve as Function)(spender, amount);
  return tx.hash as string;
}

/** Format raw token units to human-readable string */
export function formatTokenAmount(raw: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole}.${fracStr}`;
}
