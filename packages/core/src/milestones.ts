import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listMilestones(params: PaginationParams & { projectId?: string; status?: string }) {
  const { page = 1, pageSize = 20, sortBy = "dueDate", sortOrder = "asc", projectId, status } = params;
  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    db.milestone.findMany({
      where,
      include: { project: true, deployment: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.milestone.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getMilestone(id: string) {
  return db.milestone.findUnique({
    where: { id },
    include: { project: true, deployment: true, proofArtifacts: true, incentiveConditions: true },
  });
}

export async function createMilestone(data: {
  name: string;
  description?: string;
  projectId?: string;
  deploymentId?: string;
  dueDate?: Date;
  weight?: number;
  actorId?: string;
}) {
  const milestone = await db.milestone.create({
    data: {
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      deploymentId: data.deploymentId,
      dueDate: data.dueDate,
      weight: data.weight ?? 1.0,
    },
  });
  await createAuditEvent({
    eventType: "milestone.created",
    entityType: "Milestone",
    entityId: milestone.id,
    actorId: data.actorId,
    summary: `Milestone "${data.name}" created`,
    milestoneId: milestone.id,
    projectId: data.projectId,
  });
  return milestone;
}

export async function updateMilestoneStatus(id: string, status: string, actorId?: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === "completed") updateData.completedAt = new Date();
  if (status === "verified") {
    updateData.verifiedAt = new Date();
    updateData.verifiedById = actorId;
  }
  const milestone = await db.milestone.update({ where: { id }, data: updateData });
  await createAuditEvent({
    eventType: `milestone.${status}`,
    entityType: "Milestone",
    entityId: id,
    actorId,
    summary: `Milestone status changed to ${status}`,
    milestoneId: id,
    detail: { status },
  });
  return milestone;
}

export async function getMilestoneProgress(projectId: string) {
  const milestones = await db.milestone.findMany({ where: { projectId } });
  const total = milestones.length;
  const completed = milestones.filter((m) => m.status === "completed" || m.status === "verified").length;
  const verified = milestones.filter((m) => m.status === "verified").length;
  const totalWeight = milestones.reduce((s, m) => s + m.weight, 0);
  const completedWeight = milestones
    .filter((m) => m.status === "completed" || m.status === "verified")
    .reduce((s, m) => s + m.weight, 0);
  return {
    total,
    completed,
    verified,
    pending: total - completed,
    progress: totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0,
  };
}
