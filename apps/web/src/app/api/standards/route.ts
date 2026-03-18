import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const status = parseFilter(req, "status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [standards, total] = await Promise.all([
      prisma.standard.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
        include: {
          _count: { select: { certifications: true } },
        },
      }),
      prisma.standard.count({ where }),
    ]);

    return ok(standards, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/standards error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, version, description, category, body: bodyText, status } = body;

    if (!code || !name || !version) {
      return badRequest("code, name, and version are required");
    }

    const existing = await prisma.standard.findUnique({ where: { code } });
    if (existing) return badRequest("Standard with that code already exists");

    const standard = await prisma.standard.create({
      data: {
        code,
        name,
        version,
        description: description ?? null,
        category: category ?? null,
        body: bodyText ?? null,
        status: status ?? "draft",
        publishedAt: status === "published" ? new Date() : null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "standard",
        entityType: "standard",
        entityId: standard.id,
        summary: `Standard ${standard.code} v${standard.version} created`,
        detail: { standardId: standard.id, code, version },
        hash: "",
      },
    });

    return created(standard);
  } catch (error) {
    console.error("POST /api/standards error:", error);
    return serverError();
  }
}
