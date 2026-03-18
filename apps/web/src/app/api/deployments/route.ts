import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, created, badRequest, serverError, parsePagination, parseFilter } from "../_helpers";

export async function GET(req: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const projectId = parseFilter(req, "projectId");
    const phase = parseFilter(req, "phase");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (phase) where.phase = phase;

    const [deployments, total] = await Promise.all([
      prisma.deployment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { name: true, slug: true } },
        },
      }),
      prisma.deployment.count({ where }),
    ]);

    return ok(deployments, {
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/deployments error:", error);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, projectId, description, region, phase, energyOutputMW } = body;

    if (!name || !projectId) {
      return badRequest("name and projectId are required");
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return badRequest("Project not found");

    const deployment = await prisma.deployment.create({
      data: {
        name,
        projectId,
        description: description ?? null,
        region: region ?? null,
        phase: phase ?? undefined,
        energyOutputMW: energyOutputMW ?? null,
      },
    });

    await prisma.auditEvent.create({
      data: {
        eventType: "deployment",
        entityType: "deployment",
        entityId: deployment.id,
        summary: `Deployment "${deployment.name}" created`,
        detail: { deploymentId: deployment.id, projectId },
        hash: "",
        deploymentId: deployment.id,
      },
    });

    return created(deployment);
  } catch (error) {
    console.error("POST /api/deployments error:", error);
    return serverError();
  }
}
