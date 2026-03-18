// ─────────────────────────────────────────────
// SGE Wallet Verification Script
// ─────────────────────────────────────────────
// Usage:
//   npx tsx apps/web/scripts/verify-wallet.ts
//
// Optional env:
//   RPC_URL — Ethereum RPC endpoint (default: https://eth.llamarpc.com)
//
// Checks:
//   - ETH balance
//   - SGE token balance
//   - USDC balance
//   - USDT balance
//   - Current chain ID
//   - Whether wallet has already claimed
//   - Whether claim contract has SGE balance
//   - Explorer links

import { JsonRpcProvider, Contract, formatEther, formatUnits } from "ethers";

// ── Configuration ───────────────────────────

const TARGET_WALLET = "0x1FF7251B479818d0529b65d89AD314E47E5DA922";

const CONTRACTS = {
  SGE_CLAIM: "0x4BFeF695a5f85a65E1Aa6015439f317494477D09",
  SGE_TOKEN: "0x40489719E489782959486A04B765E1e93e5B221a",
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
};

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

const CLAIM_ABI = [
  "function hasClaimed(address wallet) external view returns (bool)",
  "function CLAIM_AMOUNT() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function sgeToken() external view returns (address)",
];

// ── Main ────────────────────────────────────

async function main() {
  const rpcUrl = process.env.RPC_URL || "https://eth.llamarpc.com";
  const provider = new JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  SGE Wallet Verification                      ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log();
  console.log(`Target:   ${TARGET_WALLET}`);
  console.log(`RPC:      ${rpcUrl}`);

  // Chain
  const network = await provider.getNetwork();
  console.log(`Chain ID: ${network.chainId}`);
  console.log();

  // ETH balance
  const ethBal = await provider.getBalance(TARGET_WALLET);
  const ethOk = ethBal > 0n;
  console.log(`ETH Balance:  ${formatEther(ethBal)} ETH  ${ethOk ? "✅" : "❌ No ETH for gas"}`);

  // Token balances
  const tokens = [
    { key: "SGE", address: CONTRACTS.SGE_TOKEN },
    { key: "USDC", address: CONTRACTS.USDC },
    { key: "USDT", address: CONTRACTS.USDT },
  ];

  for (const t of tokens) {
    try {
      const contract = new Contract(t.address, ERC20_ABI, provider);
      const bal: bigint = await (contract.balanceOf as Function)(TARGET_WALLET);
      const decimals: number = await (contract.decimals as Function)();
      const symbol: string = await (contract.symbol as Function)();
      console.log(`${symbol} Balance: ${formatUnits(bal, decimals)} ${symbol}  ${bal > 0n ? "✅" : "⚪"}`);
    } catch (err: any) {
      console.log(`${t.key} Balance: ERROR — ${err.message}`);
    }
  }

  // Allowances (USDC/USDT → claim contract)
  console.log();
  for (const t of [tokens[1]!, tokens[2]!]) {
    try {
      const contract = new Contract(t.address, ERC20_ABI, provider);
      const allowance: bigint = await (contract.allowance as Function)(TARGET_WALLET, CONTRACTS.SGE_CLAIM);
      const decimals: number = await (contract.decimals as Function)();
      const symbol: string = await (contract.symbol as Function)();
      console.log(`${symbol} Allowance → Claim: ${formatUnits(allowance, decimals)} ${symbol}  ${allowance > 0n ? "✅ Approved" : "⚪ Not approved"}`);
    } catch (err: any) {
      console.log(`${t.key} Allowance: ERROR — ${err.message}`);
    }
  }

  // Claim status
  console.log();
  try {
    const claimContract = new Contract(CONTRACTS.SGE_CLAIM, CLAIM_ABI, provider);
    const hasClaimed: boolean = await (claimContract.hasClaimed as Function)(TARGET_WALLET);
    console.log(`Has Claimed: ${hasClaimed ? "✅ Yes — already claimed" : "⚪ No — eligible"}`);

    const claimAmount: bigint = await (claimContract.CLAIM_AMOUNT as Function)();
    console.log(`Claim Reward: ${formatUnits(claimAmount, 18)} SGE per claim`);

    const owner: string = await (claimContract.owner as Function)();
    console.log(`Contract Owner: ${owner}`);

    // Check contract SGE balance
    const sgeContract = new Contract(CONTRACTS.SGE_TOKEN, ERC20_ABI, provider);
    const contractSgeBal: bigint = await (sgeContract.balanceOf as Function)(CONTRACTS.SGE_CLAIM);
    const sgeDecimals: number = await (sgeContract.decimals as Function)();
    console.log(`Contract SGE Balance: ${formatUnits(contractSgeBal, sgeDecimals)} SGE  ${contractSgeBal >= claimAmount ? "✅ Funded" : "❌ Drained"}`);
  } catch (err: any) {
    console.log(`Claim check: ERROR — ${err.message}`);
  }

  // Explorer links
  console.log("\n─── Explorer Links ───");
  console.log(`Wallet:    https://etherscan.io/address/${TARGET_WALLET}`);
  console.log(`Claim:     https://etherscan.io/address/${CONTRACTS.SGE_CLAIM}`);
  console.log(`SGE Token: https://etherscan.io/token/${CONTRACTS.SGE_TOKEN}`);
  console.log(`USDC:      https://etherscan.io/token/${CONTRACTS.USDC}?a=${TARGET_WALLET}`);
  console.log(`USDT:      https://etherscan.io/token/${CONTRACTS.USDT}?a=${TARGET_WALLET}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
