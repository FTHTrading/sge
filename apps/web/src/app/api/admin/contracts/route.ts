import { NextResponse } from "next/server";
import { db } from "@sge/db";

// GET /api/admin/contracts — return all blockchain config
export async function GET() {
  try {
    const [networks, tokens, contracts, rules] = await Promise.all([
      db.blockchainNetwork.findMany({ orderBy: { chainId: "asc" } }),
      db.tokenContract.findMany({
        orderBy: { symbol: "asc" },
        include: { network: { select: { name: true, chainId: true } } },
      }),
      db.claimContract.findMany({
        orderBy: { createdAt: "desc" },
        include: { network: { select: { name: true, chainId: true } } },
      }),
      db.claimRule.findMany({
        orderBy: { createdAt: "desc" },
        include: { tokenContract: { select: { symbol: true } } },
      }),
    ]);

    return NextResponse.json({
      networks,
      tokens,
      contracts,
      rules: rules.map((r: any) => ({
        id: r.id,
        tokenSymbol: r.tokenContract.symbol,
        claimAmountHuman: r.claimAmountHuman,
        isActive: r.isActive,
        totalClaimed: r.totalClaimed,
        maxClaims: r.maxClaims,
        description: r.description,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
