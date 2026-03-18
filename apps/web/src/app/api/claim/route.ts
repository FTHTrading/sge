import { NextRequest, NextResponse } from "next/server";
import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";

// GET /api/claim — list claims, optionally filtered by wallet
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Number(searchParams.get("offset") ?? 0);

    const where = wallet ? { walletAddress: wallet.toLowerCase() } : {};

    const [claims, total] = await Promise.all([
      db.walletClaim.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          tokenContract: { select: { symbol: true, decimals: true } },
          contract: { select: { name: true, address: true } },
        },
      }),
      db.walletClaim.count({ where }),
    ]);

    return NextResponse.json({
      claims: claims.map((c: any) => ({
        id: c.id,
        walletAddress: c.walletAddress,
        tokenSymbol: c.tokenContract.symbol,
        amountHuman: c.claimAmountHuman,
        status: c.status,
        approveTxHash: c.approveTxHash,
        claimTxHash: c.claimTxHash,
        blockNumber: c.blockNumber,
        failureReason: c.failureReason,
        claimedAt: c.claimedAt,
        createdAt: c.createdAt,
      })),
      total,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/claim — record a new claim or update status
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      walletAddress,
      tokenSymbol,
      action, // "initiate" | "approve" | "claim" | "confirm" | "fail"
      txHash,
      blockNumber,
      failureReason,
    } = body;

    if (!walletAddress || !action) {
      return NextResponse.json({ error: "walletAddress and action are required" }, { status: 400 });
    }

    const wallet = walletAddress.toLowerCase();

    if (action === "initiate") {
      // Find claim contract and token
      const claimContract = await db.claimContract.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!claimContract) {
        return NextResponse.json({ error: "No active claim contract" }, { status: 400 });
      }

      const token = await db.tokenContract.findFirst({
        where: { symbol: tokenSymbol ?? "USDC", isSupported: true },
        select: { id: true },
      });
      if (!token) {
        return NextResponse.json({ error: "Unsupported token" }, { status: 400 });
      }

      // Find claim rule for amount
      const rule = await db.claimRule.findFirst({
        where: { contractId: claimContract.id, tokenContractId: token.id, isActive: true },
      });
      if (!rule) {
        return NextResponse.json({ error: "No active claim rule for this token" }, { status: 400 });
      }

      // Check for existing claim
      const existing = await db.walletClaim.findUnique({
        where: { walletAddress_contractId: { walletAddress: wallet, contractId: claimContract.id } },
      });
      if (existing) {
        return NextResponse.json({ error: "Wallet has already claimed", existing }, { status: 409 });
      }

      const claim = await db.walletClaim.create({
        data: {
          walletAddress: wallet,
          contractId: claimContract.id,
          tokenContractId: token.id,
          status: "initiated",
          claimAmount: rule.claimAmount,
          claimAmountHuman: rule.claimAmountHuman,
        },
      });

      // Log and audit
      await db.transactionLog.create({
        data: { claimId: claim.id, txType: "initiate", status: "initiated" },
      });

      await createAuditEvent({
        eventType: "claim",
        entityType: "wallet_claim",
        entityId: claim.id,
        summary: `Claim initiated for wallet ${wallet}`,
        detail: { walletAddress: wallet, tokenSymbol: tokenSymbol ?? "USDC" },
      });

      return NextResponse.json({ claim }, { status: 201 });
    }

    // For all other actions, look up existing claim
    const claim = await db.walletClaim.findFirst({
      where: { walletAddress: wallet },
      orderBy: { createdAt: "desc" },
    });
    if (!claim) {
      return NextResponse.json({ error: "No claim found for this wallet" }, { status: 404 });
    }

    if (action === "approve") {
      await db.walletClaim.update({
        where: { id: claim.id },
        data: { status: "approval_confirmed", approveTxHash: txHash ?? null },
      });
      if (txHash) {
        await db.transactionLog.create({
          data: { claimId: claim.id, txType: "approve", txHash, status: "confirmed" },
        });
      }
      return NextResponse.json({ ok: true, status: "approval_confirmed" });
    }

    if (action === "claim") {
      await db.walletClaim.update({
        where: { id: claim.id },
        data: { status: "claim_submitted", claimTxHash: txHash ?? null },
      });
      if (txHash) {
        await db.transactionLog.create({
          data: { claimId: claim.id, txType: "claim", txHash, status: "submitted" },
        });
      }
      return NextResponse.json({ ok: true, status: "claim_submitted" });
    }

    if (action === "confirm") {
      await db.walletClaim.update({
        where: { id: claim.id },
        data: {
          status: "claim_confirmed",
          claimTxHash: txHash ?? claim.claimTxHash,
          blockNumber: blockNumber ?? null,
          claimedAt: new Date(),
        },
      });

      // Create receipt
      const tokenContract = await db.tokenContract.findUnique({
        where: { id: claim.tokenContractId },
        include: { network: true },
      });

      await db.claimReceipt.create({
        data: {
          claimId: claim.id,
          walletAddress: wallet,
          tokenSymbol: tokenContract?.symbol ?? "USDC",
          amountHuman: claim.claimAmountHuman,
          amountRaw: claim.claimAmount,
          approveTxHash: claim.approveTxHash,
          claimTxHash: txHash ?? claim.claimTxHash ?? "",
          blockNumber: blockNumber ?? null,
          networkName: tokenContract?.network?.name ?? "Ethereum Mainnet",
          chainId: tokenContract?.network?.chainId ?? 1,
          explorerUrl: txHash ? `https://etherscan.io/tx/${txHash}` : null,
        },
      });

      await db.transactionLog.create({
        data: {
          claimId: claim.id,
          txType: "claim",
          txHash: txHash ?? claim.claimTxHash,
          status: "confirmed",
          blockNumber,
        },
      });

      // Increment claim rule counter
      const rule = await db.claimRule.findFirst({
        where: { contractId: claim.contractId, tokenContractId: claim.tokenContractId },
      });
      if (rule) {
        await db.claimRule.update({
          where: { id: rule.id },
          data: { totalClaimed: { increment: 1 } },
        });
      }

      await createAuditEvent({
        eventType: "claim",
        entityType: "wallet_claim",
        entityId: claim.id,
        summary: `Claim confirmed for wallet ${wallet}`,
        detail: { walletAddress: wallet, txHash, blockNumber },
      });

      return NextResponse.json({ ok: true, status: "claim_confirmed" });
    }

    if (action === "fail") {
      await db.walletClaim.update({
        where: { id: claim.id },
        data: { status: "failed", failureReason: failureReason ?? "Unknown error" },
      });
      await db.transactionLog.create({
        data: {
          claimId: claim.id,
          txType: "claim",
          status: "failed",
          errorMessage: failureReason ?? "Unknown error",
        },
      });
      return NextResponse.json({ ok: true, status: "failed" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
