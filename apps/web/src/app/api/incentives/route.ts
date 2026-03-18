import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = parseFilter(req, "status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [plans, total] = await Promise.all([
      prisma.incentivePlan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          partner: { select: { id: true, organization: { select: { name: true } } } },
          conditions: true,
          _count: { select: { conditions: true } },
        },
      }),
      prisma.incentivePlan.count({ where }),
    ]);

    return ok(plans, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/incentives error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, partnerId, description, conditions } = body;

    if (!name || !partnerId) {
      return badRequest("name and partnerId are required");
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return badRequest("Partner not found");

    const plan = await prisma.incentivePlan.create({
      data: {
        name,
        partnerId,
        description: description ?? null,
        conditions: conditions
          ? {
              create: conditions.map((c: { title: string; type: string; threshold: number }) => ({
                title: c.title,
                type: c.type,
                threshold: c.threshold,
              })),
            }
          : undefined,
      },
      include: { conditions: true },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "incentive",
        entityType: "incentive_plan",
        entityId: plan.id,
        summary: `Incentive plan "${plan.name}" created`,
        detail: { planId: plan.id, name },
        hash: "",
        planId: plan.id,
      },
    });

    return created(plan);
  } catch (error) {
    console.error("POST /api/incentives error:", error);
    return serverError();
  }
}
