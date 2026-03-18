import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listProjects(params: PaginationParams & { status?: string; partnerId?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", search, status, partnerId } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { region: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    db.project.findMany({
      where,
      include: { partner: { include: { organization: true } }, deployments: true, milestones: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.project.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getProject(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      partner: { include: { organization: true } },
      deployments: true,
      milestones: { orderBy: { dueDate: "asc" } },
      documents: true,
    },
  });
}

export async function createProject(data: {
  name: string;
  slug: string;
  description?: string;
  region?: string;
  country?: string;
  partnerId?: string;
  energyGoalMW?: number;
  startDate?: Date;
  targetDate?: Date;
  actorId?: string;
}) {
  const project = await db.project.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      region: data.region,
      country: data.country,
      partnerId: data.partnerId,
      energyGoalMW: data.energyGoalMW,
      startDate: data.startDate,
      targetDate: data.targetDate,
    },
  });
  await createAuditEvent({
    eventType: "project.created",
    entityType: "Project",
    entityId: project.id,
    actorId: data.actorId,
    summary: `Project "${data.name}" created`,
    projectId: project.id,
    partnerId: data.partnerId,
  });
  return project;
}

export async function updateProjectStatus(id: string, status: string, actorId?: string) {
  const project = await db.project.update({ where: { id }, data: { status: status as any } });
  await createAuditEvent({
    eventType: "project.status_changed",
    entityType: "Project",
    entityId: id,
    actorId,
    summary: `Project status changed to ${status}`,
    projectId: id,
    detail: { status },
  });
  return project;
}

export async function createDeployment(data: {
  projectId: string;
  name: string;
  description?: string;
  region?: string;
  actorId?: string;
}) {
  const deployment = await db.deployment.create({
    data: {
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      region: data.region,
    },
  });
  await createAuditEvent({
    eventType: "deployment.created",
    entityType: "Deployment",
    entityId: deployment.id,
    actorId: data.actorId,
    summary: `Deployment "${data.name}" created`,
    deploymentId: deployment.id,
    projectId: data.projectId,
  });
  return deployment;
}

export async function updateDeploymentPhase(id: string, phase: string, actorId?: string) {
  const deployment = await db.deployment.update({ where: { id }, data: { phase: phase as any } });
  await createAuditEvent({
    eventType: "deployment.phase_changed",
    entityType: "Deployment",
    entityId: id,
    actorId,
    summary: `Deployment phase changed to ${phase}`,
    deploymentId: id,
    detail: { phase },
  });
  return deployment;
}
