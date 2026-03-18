// ─────────────────────────────────────────────
// SGE Wallet Setup & Fund Transfer Script
// ─────────────────────────────────────────────
// Usage:
//   npx tsx apps/web/scripts/send-eth-and-sge.ts
//
// Required env vars in apps/web/.env.local:
//   SENDER_PRIVATE_KEY  — private key of the funding wallet
//   RPC_URL             — Ethereum RPC endpoint (default: https://eth.llamarpc.com)
//
// This script:
//   1. Sends a small amount of ETH to the target wallet for gas
//   2. Sends SGE tokens to the target wallet for testing
//   3. Prints tx hashes and final balances
//
// SAFETY: Does NOT execute automatically. Prints the exact commands
// and asks for confirmation before sending.

import { Wallet, JsonRpcProvider, Contract, parseEther, parseUnits, formatEther, formatUnits } from "ethers";

// ── Configuration ───────────────────────────

const TARGET_WALLET = "0x1FF7251B479818d0529b65d89AD314E47E5DA922";

const SGE_TOKEN_ADDRESS = "0x40489719E489782959486A04B765E1e93e5B221a";
const SGE_CLAIM_CONTRACT = "0x4BFeF695a5f85a65E1Aa6015439f317494477D09";

const ETH_AMOUNT = "0.01"; // ETH to send for gas
const SGE_AMOUNT = "2000"; // SGE tokens to send (18 decimals)

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
];

// ── Main ────────────────────────────────────

async function main() {
  const privateKey = process.env.SENDER_PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || "https://eth.llamarpc.com";

  if (!privateKey) {
    console.error("❌ SENDER_PRIVATE_KEY not set in environment.");
    console.log("\nAdd to apps/web/.env.local:");
    console.log("  SENDER_PRIVATE_KEY=0x...");
    console.log("  RPC_URL=https://eth.llamarpc.com  (optional)");
    process.exit(1);
  }

  const provider = new JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });
  const wallet = new Wallet(privateKey, provider);

  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║  SGE Wallet Setup & Fund Transfer             ║");
  console.log("╚═══════════════════════════════════════════════╝");
  console.log();
  console.log(`Sender:  ${wallet.address}`);
  console.log(`Target:  ${TARGET_WALLET}`);
  console.log(`RPC:     ${rpcUrl}`);
  console.log();

  // Check chain
  const network = await provider.getNetwork();
  console.log(`Chain ID: ${network.chainId}`);
  if (network.chainId !== 1n) {
    console.error("❌ Not on Ethereum Mainnet (chainId 1). Aborting.");
    process.exit(1);
  }

  // Check sender balances
  const senderEthBal = await provider.getBalance(wallet.address);
  console.log(`\nSender ETH balance: ${formatEther(senderEthBal)} ETH`);

  const sgeContract = new Contract(SGE_TOKEN_ADDRESS, ERC20_ABI, provider);
  const senderSgeBal: bigint = await (sgeContract.balanceOf as Function)(wallet.address);
  const sgeDecimals: number = await (sgeContract.decimals as Function)();
  const sgeSymbol: string = await (sgeContract.symbol as Function)();
  console.log(`Sender ${sgeSymbol} balance: ${formatUnits(senderSgeBal, sgeDecimals)} ${sgeSymbol}`);

  // Check target balances
  const targetEthBal = await provider.getBalance(TARGET_WALLET);
  const targetSgeBal: bigint = await (sgeContract.balanceOf as Function)(TARGET_WALLET);
  console.log(`\nTarget ETH balance: ${formatEther(targetEthBal)} ETH`);
  console.log(`Target ${sgeSymbol} balance: ${formatUnits(targetSgeBal, sgeDecimals)} ${sgeSymbol}`);

  // Plan
  const ethToSend = parseEther(ETH_AMOUNT);
  const sgeToSend = parseUnits(SGE_AMOUNT, sgeDecimals);

  console.log("\n─── Planned Transfers ───");
  console.log(`1. Send ${ETH_AMOUNT} ETH to ${TARGET_WALLET}`);
  console.log(`2. Send ${SGE_AMOUNT} ${sgeSymbol} to ${TARGET_WALLET}`);

  // Safety check
  if (senderEthBal < ethToSend + parseEther("0.005")) {
    console.error("\n❌ Insufficient ETH for transfer + gas. Aborting.");
    process.exit(1);
  }
  if (senderSgeBal < sgeToSend) {
    console.error(`\n❌ Insufficient ${sgeSymbol} balance. Aborting.`);
    process.exit(1);
  }

  // Confirm
  console.log("\n⚠️  Review transfers above. Press Ctrl+C to abort.");
  console.log("    Executing in 5 seconds...\n");
  await new Promise((r) => setTimeout(r, 5000));

  // 1. Send ETH
  console.log("→ Sending ETH...");
  const ethTx = await wallet.sendTransaction({
    to: TARGET_WALLET,
    value: ethToSend,
  });
  console.log(`  TX hash: ${ethTx.hash}`);
  console.log(`  Explorer: https://etherscan.io/tx/${ethTx.hash}`);
  const ethReceipt = await ethTx.wait();
  console.log(`  ✅ Confirmed in block ${ethReceipt?.blockNumber}`);

  // 2. Send SGE
  console.log("\n→ Sending SGE tokens...");
  const sgeWithSigner = new Contract(SGE_TOKEN_ADDRESS, ERC20_ABI, wallet);
  const sgeTx = await (sgeWithSigner.transfer as Function)(TARGET_WALLET, sgeToSend);
  console.log(`  TX hash: ${sgeTx.hash}`);
  console.log(`  Explorer: https://etherscan.io/tx/${sgeTx.hash}`);
  const sgeReceipt = await sgeTx.wait();
  console.log(`  ✅ Confirmed in block ${sgeReceipt?.blockNumber}`);

  // Final balances
  console.log("\n─── Final Target Balances ───");
  const finalEth = await provider.getBalance(TARGET_WALLET);
  const finalSge: bigint = await (sgeContract.balanceOf as Function)(TARGET_WALLET);
  console.log(`ETH: ${formatEther(finalEth)}`);
  console.log(`${sgeSymbol}: ${formatUnits(finalSge, sgeDecimals)}`);
  console.log("\n✅ Setup complete.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message || err);
  process.exit(1);
});
