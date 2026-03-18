import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = parseFilter(req, "status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [proposals, total] = await Promise.all([
      prisma.governanceProposal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          resolutions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.governanceProposal.count({ where }),
    ]);

    return ok(proposals, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/governance error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, bodyText, category, authorId, committee } = body;

    if (!title) {
      return badRequest("title is required");
    }

    const proposal = await prisma.governanceProposal.create({
      data: {
        title,
        summary: summary ?? null,
        body: bodyText ?? null,
        category: category ?? null,
        authorId: authorId ?? null,
        committee: committee ?? null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "governance",
        entityType: "proposal",
        entityId: proposal.id,
        summary: `Proposal "${proposal.title}" created`,
        detail: { proposalId: proposal.id, title },
        hash: "",
      },
    });

    return created(proposal);
  } catch (error) {
    console.error("POST /api/governance error:", error);
    return serverError();
  }
}
