import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const projectId = parseFilter(req, "projectId");
    const status = parseFilter(req, "status");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [milestones, total] = await Promise.all([
      prisma.milestone.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: "asc" },
        include: {
          project: { select: { name: true, slug: true } },
        },
      }),
      prisma.milestone.count({ where }),
    ]);

    return ok(milestones, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/milestones error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, projectId, dueDate, weight } = body;

    if (!name || !projectId) {
      return badRequest("name and projectId are required");
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return badRequest("Project not found");

    const milestone = await prisma.milestone.create({
      data: {
        name,
        description: description ?? null,
        projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        weight: weight ?? 1,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "milestone",
        entityType: "milestone",
        entityId: milestone.id,
        summary: `Milestone "${milestone.name}" created`,
        detail: { milestoneId: milestone.id, projectId },
        hash: "",
        milestoneId: milestone.id,
      },
    });

    return created(milestone);
  } catch (error) {
    console.error("POST /api/milestones error:", error);
    return serverError();
  }
}
