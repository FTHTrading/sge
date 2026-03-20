#!/usr/bin/env npx tsx
// ─────────────────────────────────────────────
// SGE Live Claim Test
// ─────────────────────────────────────────────
// Usage:
//   npx tsx apps/web/scripts/test-live-claim.ts --token=usdc
//   npx tsx apps/web/scripts/test-live-claim.ts --token=usdt
//
// Env (in apps/web/.env.local):
//   MAINNET_RPC_URL          — Ethereum RPC endpoint
//   PRIVATE_KEY              — Wallet private key (REQUIRED for live claim)
//   CLAIM_CONTRACT_ADDRESS   — Claim contract
//   SGE_TOKEN_ADDRESS        — SGE token
//   USDC_TOKEN_ADDRESS       — USDC
//   USDT_TOKEN_ADDRESS       — USDT
//
// This script:
//   1. Runs preflight checks
//   2. Aborts safely if not ready
//   3. Approves stablecoin if needed (USDT: zero-first pattern)
//   4. Calls claimWithUSDC() or claimWithUSDT()
//   5. Waits for receipt
//   6. Re-reads balances
//   7. Prints before/after summary
//   8. Prints PASS/FAIL

import { JsonRpcProvider, Wallet as EthersWallet, Contract, formatEther, formatUnits } from "ethers";

// ── Parse args ──────────────────────────────

const tokenArg = process.argv.find((a) => a.startsWith("--token="))?.split("=")[1]?.toLowerCase();
if (!tokenArg || !["usdc", "usdt"].includes(tokenArg)) {
  console.error("Usage: npx tsx apps/web/scripts/test-live-claim.ts --token=usdc|usdt");
  process.exit(1);
}
const TOKEN = tokenArg.toUpperCase() as "USDC" | "USDT";

// ── Addresses ───────────────────────────────

const CLAIM_CONTRACT = process.env.CLAIM_CONTRACT_ADDRESS ?? "0x4BFeF695a5f85a65E1Aa6015439f317494477D09";
const SGE_TOKEN      = process.env.SGE_TOKEN_ADDRESS      ?? "0x40489719E489782959486A04B765E1e93e5B221a";
const USDC_TOKEN     = process.env.USDC_TOKEN_ADDRESS      ?? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_TOKEN     = process.env.USDT_TOKEN_ADDRESS      ?? "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const STABLE_TOKEN = TOKEN === "USDC" ? USDC_TOKEN : USDT_TOKEN;
const STABLE_AMOUNT = 100_000_000n; // 100e6

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const CLAIM_ABI = [
  "function claimWithUSDC() external",
  "function claimWithUSDT() external",
  "function hasClaimed(address) view returns (bool)",
  "function CLAIM_AMOUNT() view returns (uint256)",
];

// ── Setup ───────────────────────────────────

const rpcUrl = process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com";
if (!process.env.PRIVATE_KEY) {
  console.error("ERROR: PRIVATE_KEY not set in environment. Cannot execute live claim.");
  process.exit(1);
}

const provider = new JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });
const wallet = new EthersWallet(process.env.PRIVATE_KEY, provider);

// ── Helpers ─────────────────────────────────

async function readBalances(addr: string) {
  const ethBal = await provider.getBalance(addr);
  const stableContract = new Contract(STABLE_TOKEN, ERC20_ABI, provider);
  const stableBal: bigint = await (stableContract.balanceOf as Function)(addr);
  const sgeContract = new Contract(SGE_TOKEN, [...ERC20_ABI, "function decimals() view returns (uint8)"], provider);
  const sgeBal: bigint = await (sgeContract.balanceOf as Function)(addr);
  return { ethBal, stableBal, sgeBal };
}

function p(label: string, val: string) {
  console.log(`  ${label.padEnd(22)} ${val}`);
}

// ── Main ────────────────────────────────────

async function main() {
  console.log("╔═══════════════════════════════════════════════════════╗");
  console.log(`║  SGE Live Claim Test — ${TOKEN}                          ║`);
  console.log("╚═══════════════════════════════════════════════════════╝");
  console.log();

  const walletAddress = wallet.address;
  p("Wallet:", walletAddress);
  p("RPC:", rpcUrl);
  p("Token:", TOKEN);
  console.log();

  // ── 1. PREFLIGHT ──────────────────────────

  console.log("── Preflight ──────────────────────────");

  // Chain
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 1) {
    console.error("  ❌ ABORT: Not on Ethereum Mainnet");
    process.exit(1);
  }
  p("Chain:", "Ethereum Mainnet ✅");

  // ETH balance
  const ethBal = await provider.getBalance(walletAddress);
  const ethHuman = Number(formatEther(ethBal));
  p("ETH:", `${ethHuman.toFixed(6)} ETH`);
  if (ethHuman < 0.02) {
    console.error("  ❌ ABORT: Insufficient ETH for gas (need ≥ 0.02)");
    process.exit(1);
  }

  // Stablecoin balance
  const stableRead = new Contract(STABLE_TOKEN, ERC20_ABI, provider);
  const stableBal: bigint = await (stableRead.balanceOf as Function)(walletAddress);
  p(`${TOKEN}:`, `${formatUnits(stableBal, 6)} ${TOKEN}`);
  if (stableBal < STABLE_AMOUNT) {
    console.error(`  ❌ ABORT: Insufficient ${TOKEN} (need ≥ 100)`);
    process.exit(1);
  }

  // Contract SGE
  const sgeRead = new Contract(SGE_TOKEN, ERC20_ABI, provider);
  const contractSge: bigint = await (sgeRead.balanceOf as Function)(CLAIM_CONTRACT);
  p("Contract SGE:", `${formatUnits(contractSge, 18)} SGE`);
  if (contractSge < 1000n * 10n ** 18n) {
    console.error("  ❌ ABORT: Contract drained — claims will revert");
    process.exit(1);
  }

  // hasClaimed
  const claimRead = new Contract(CLAIM_CONTRACT, CLAIM_ABI, provider);
  const already: boolean = await (claimRead.hasClaimed as Function)(walletAddress);
  p("Has Claimed:", already ? "Yes" : "No");
  if (already) {
    console.error("  ❌ ABORT: Wallet has already claimed");
    process.exit(1);
  }

  // Claim reward
  const reward: bigint = await (claimRead.CLAIM_AMOUNT as Function)();
  p("Claim Reward:", `${formatUnits(reward, 18)} SGE`);

  console.log();
  console.log("  ✅ Preflight PASSED — proceeding with claim");
  console.log();

  // ── 2. BEFORE BALANCES ────────────────────

  const before = await readBalances(walletAddress);
  console.log("── Before Balances ────────────────────");
  p("ETH:", `${formatEther(before.ethBal)} ETH`);
  p(`${TOKEN}:`, `${formatUnits(before.stableBal, 6)} ${TOKEN}`);
  p("SGE:", `${formatUnits(before.sgeBal, 18)} SGE`);
  console.log();

  // ── 3. APPROVE IF NEEDED ──────────────────

  const stableWrite = new Contract(STABLE_TOKEN, ERC20_ABI, wallet);
  const currentAllow: bigint = await (stableRead.allowance as Function)(walletAddress, CLAIM_CONTRACT);
  p("Current Allowance:", `${formatUnits(currentAllow, 6)} ${TOKEN}`);

  if (currentAllow < STABLE_AMOUNT) {
    console.log();
    console.log(`── Approving ${TOKEN} ─────────────────────`);

    // USDT zero-first pattern
    if (TOKEN === "USDT" && currentAllow > 0n) {
      console.log("  USDT: Resetting allowance to 0 first…");
      const resetTx = await (stableWrite.approve as Function)(CLAIM_CONTRACT, 0);
      console.log(`  Reset tx: ${resetTx.hash}`);
      const resetReceipt = await resetTx.wait(1);
      console.log(`  Reset confirmed in block ${resetReceipt.blockNumber}`);
    }

    console.log(`  Approving ${formatUnits(STABLE_AMOUNT, 6)} ${TOKEN}…`);
    const approveTx = await (stableWrite.approve as Function)(CLAIM_CONTRACT, STABLE_AMOUNT);
    console.log(`  Approve tx: ${approveTx.hash}`);
    const approveReceipt = await approveTx.wait(1);
    console.log(`  Approve confirmed in block ${approveReceipt.blockNumber} ✅`);
  } else {
    console.log("  Allowance sufficient — skipping approval ✅");
  }

  console.log();

  // ── 4. EXECUTE CLAIM ──────────────────────

  console.log(`── Executing claimWith${TOKEN}() ───────`);
  const claimWrite = new Contract(CLAIM_CONTRACT, CLAIM_ABI, wallet);

  let claimTx: any;
  if (TOKEN === "USDC") {
    claimTx = await (claimWrite.claimWithUSDC as Function)();
  } else {
    claimTx = await (claimWrite.claimWithUSDT as Function)();
  }

  console.log(`  Tx hash: ${claimTx.hash}`);
  console.log("  Waiting for confirmation…");

  const receipt = await claimTx.wait(1);
  console.log(`  Confirmed in block ${receipt.blockNumber}`);
  console.log(`  Status: ${receipt.status === 1 ? "SUCCESS ✅" : "REVERTED ❌"}`);
  console.log(`  Gas used: ${receipt.gasUsed.toString()}`);
  console.log();

  if (receipt.status !== 1) {
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║  ❌ RESULT: FAIL — transaction reverted              ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  // ── 5. AFTER BALANCES ─────────────────────

  // Wait a moment for indexing
  await new Promise((r) => setTimeout(r, 2000));
  const after = await readBalances(walletAddress);

  console.log("── After Balances ─────────────────────");
  p("ETH:", `${formatEther(after.ethBal)} ETH`);
  p(`${TOKEN}:`, `${formatUnits(after.stableBal, 6)} ${TOKEN}`);
  p("SGE:", `${formatUnits(after.sgeBal, 18)} SGE`);
  console.log();

  // ── 6. SUMMARY ────────────────────────────

  const stableDelta = before.stableBal - after.stableBal;
  const sgeDelta = after.sgeBal - before.sgeBal;
  const ethDelta = before.ethBal - after.ethBal;

  console.log("── Summary ────────────────────────────");
  p(`${TOKEN} spent:`, `${formatUnits(stableDelta, 6)} ${TOKEN}`);
  p("SGE received:", `${formatUnits(sgeDelta, 18)} SGE`);
  p("ETH (gas):", `${formatEther(ethDelta)} ETH`);
  p("Claim tx:", claimTx.hash);
  p("Explorer:", `https://etherscan.io/tx/${claimTx.hash}`);
  console.log();

  // ── 7. VERDICT ────────────────────────────

  const expectedSge = 1000n * 10n ** 18n;
  const pass = sgeDelta >= expectedSge && stableDelta >= STABLE_AMOUNT;

  if (pass) {
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║  ✅ RESULT: PASS                                      ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
  } else {
    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║  ❌ RESULT: FAIL — unexpected balance changes        ║");
    console.log("╚═══════════════════════════════════════════════════════╝");
    if (sgeDelta < expectedSge) console.log(`  Expected ≥ 1000 SGE, got ${formatUnits(sgeDelta, 18)}`);
    if (stableDelta < STABLE_AMOUNT) console.log(`  Expected ≥ 100 ${TOKEN} spent, got ${formatUnits(stableDelta, 6)}`);
  }

  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL:", err.message ?? err);
  process.exit(1);
});
