import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listPartners(params: PaginationParams & { status?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", search, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { organization: { name: { contains: search, mode: "insensitive" } } },
      { contactName: { contains: search, mode: "insensitive" } },
      { contactEmail: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    db.partner.findMany({
      where,
      include: { organization: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.partner.count({ where }),
  ]);
  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

export async function getPartner(id: string) {
  return db.partner.findUnique({
    where: { id },
    include: {
      organization: true,
      projects: true,
      incentivePlans: true,
      certificationSubmissions: { include: { definition: true } },
    },
  });
}

export async function createPartner(data: {
  organizationId: string;
  tier?: "strategic" | "premier" | "standard" | "associate";
  contactName?: string;
  contactEmail?: string;
  region?: string;
  commitmentSummary?: string;
  actorId?: string;
}) {
  const partner = await db.partner.create({
    data: {
      organizationId: data.organizationId,
      tier: data.tier ?? "standard",
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      region: data.region,
      commitmentSummary: data.commitmentSummary,
    },
  });
  await createAuditEvent({
    eventType: "partner.created",
    entityType: "Partner",
    entityId: partner.id,
    actorId: data.actorId,
    summary: `Partner created for organization ${data.organizationId}`,
    partnerId: partner.id,
    organizationId: data.organizationId,
  });
  return partner;
}

export async function updatePartner(
  id: string,
  data: Record<string, unknown>,
  actorId?: string
) {
  const partner = await db.partner.update({ where: { id }, data });
  await createAuditEvent({
    eventType: "partner.updated",
    entityType: "Partner",
    entityId: id,
    actorId,
    summary: `Partner ${id} updated`,
    partnerId: id,
    detail: data,
  });
  return partner;
}
