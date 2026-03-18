import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseSearch, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = parseSearch(req);
    const status = parseFilter(req, "status");
    const partnerId = parseFilter(req, "partnerId");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { region: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (partnerId) where.partnerId = partnerId;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          partner: { select: { id: true, tier: true, organization: { select: { name: true } } } },
          _count: { select: { deployments: true, milestones: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return ok(projects, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, partnerId, region, country, energyGoalMW, description } = body;

    if (!name || !slug || !partnerId) {
      return badRequest("name, slug, and partnerId are required");
    }

    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) return badRequest("Partner not found");

    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) return badRequest("A project with that slug already exists");

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        partnerId,
        region: region ?? null,
        country: country ?? null,
        energyGoalMW: energyGoalMW ?? null,
        description: description ?? null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "project",
        entityType: "project",
        entityId: project.id,
        summary: `Project "${project.name}" created`,
        detail: { projectId: project.id, name, partnerId },
        hash: "",
        projectId: project.id,
      },
    });

    return created(project);
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return serverError();
  }
}
