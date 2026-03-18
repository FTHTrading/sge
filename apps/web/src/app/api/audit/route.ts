import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const eventType = parseFilter(req, "eventType");
    const entityType = parseFilter(req, "entityType");
    const entityId = parseFilter(req, "entityId");

    const where: Record<string, unknown> = {};
    if (eventType) where.eventType = { contains: eventType, mode: "insensitive" };
    if (entityType) where.entityType = { contains: entityType, mode: "insensitive" };
    if (entityId) where.entityId = entityId;

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return ok(events, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return serverError();
  }
}
