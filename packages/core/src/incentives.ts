import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listIncentivePlans(params: PaginationParams & { partnerId?: string; status?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", partnerId, status } = params;
  const where: Record<string, unknown> = {};
  if (partnerId) where.partnerId = partnerId;
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    db.incentivePlan.findMany({
      where,
      include: { partner: { include: { organization: true } }, conditions: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.incentivePlan.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getIncentivePlan(id: string) {
  return db.incentivePlan.findUnique({
    where: { id },
    include: {
      partner: { include: { organization: true } },
      conditions: { include: { milestone: true }, orderBy: { createdAt: "asc" } },
    },
  });
}

export async function createIncentivePlan(data: {
  name: string;
  description?: string;
  partnerId: string;
  startDate?: Date;
  endDate?: Date;
  totalUnits?: number;
  currency?: string;
  actorId?: string;
}) {
  const plan = await db.incentivePlan.create({
    data: {
      name: data.name,
      description: data.description,
      partnerId: data.partnerId,
      startDate: data.startDate,
      endDate: data.endDate,
      totalUnits: data.totalUnits,
      currency: data.currency ?? "USDC",
    },
  });
  await createAuditEvent({
    eventType: "incentive.plan_created",
    entityType: "IncentivePlan",
    entityId: plan.id,
    actorId: data.actorId,
    summary: `Incentive plan "${data.name}" created`,
    planId: plan.id,
    partnerId: data.partnerId,
  });
  return plan;
}

export async function addIncentiveCondition(data: {
  planId: string;
  milestoneId?: string;
  conditionType: string;
  description?: string;
  threshold?: number;
  units?: number;
  triggerDate?: Date;
  actorId?: string;
}) {
  const condition = await db.incentiveCondition.create({
    data: {
      planId: data.planId,
      milestoneId: data.milestoneId,
      conditionType: data.conditionType as any,
      description: data.description,
      threshold: data.threshold,
      units: data.units,
      triggerDate: data.triggerDate,
    },
  });
  await createAuditEvent({
    eventType: "incentive.condition_added",
    entityType: "IncentiveCondition",
    entityId: condition.id,
    actorId: data.actorId,
    summary: `Condition added to plan ${data.planId}`,
    conditionId: condition.id,
    planId: data.planId,
  });
  return condition;
}

export async function triggerCondition(id: string, actorId?: string) {
  const condition = await db.incentiveCondition.update({
    where: { id },
    data: { status: "triggered", triggeredAt: new Date(), approvedById: actorId },
  });
  // Update plan claimed units
  if (condition.units) {
    await db.incentivePlan.update({
      where: { id: condition.planId },
      data: { claimedUnits: { increment: condition.units } },
    });
  }
  await createAuditEvent({
    eventType: "incentive.condition_triggered",
    entityType: "IncentiveCondition",
    entityId: id,
    actorId,
    summary: `Condition triggered${condition.units ? ` — ${condition.units} units released` : ""}`,
    conditionId: id,
    planId: condition.planId,
  });
  return condition;
}
