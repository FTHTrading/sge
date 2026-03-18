import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseSearch, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = parseSearch(req);
    const tier = parseFilter(req, "tier");
    const status = parseFilter(req, "status");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { organization: { name: { contains: search, mode: "insensitive" } } },
        { contactName: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tier) where.tier = tier;
    if (status) where.status = status;

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { name: true } },
          _count: { select: { projects: true } },
        },
      }),
      prisma.partner.count({ where }),
    ]);

    return ok(partners, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/partners error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, tier, region, contactName, contactEmail, commitmentSummary, notes } = body;

    if (!organizationId || !tier) {
      return badRequest("organizationId and tier are required");
    }

    const partner = await prisma.partner.create({
      data: {
        organizationId,
        tier,
        region: region ?? null,
        contactName: contactName ?? null,
        contactEmail: contactEmail ?? null,
        commitmentSummary: commitmentSummary ?? null,
        notes: notes ?? null,
      },
      include: { organization: true },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "partner",
        entityType: "partner",
        entityId: partner.id,
        summary: `Partner created for org ${partner.organization.name}`,
        detail: { partnerId: partner.id, tier: partner.tier },
        hash: "",
        partnerId: partner.id,
      },
    });

    return created(partner);
  } catch (error) {
    console.error("POST /api/partners error:", error);
    return serverError();
  }
}
