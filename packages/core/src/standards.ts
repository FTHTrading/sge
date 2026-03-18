import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listStandards(params: PaginationParams & { status?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", search, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    db.standard.findMany({
      where,
      include: { certifications: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.standard.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getStandard(id: string) {
  return db.standard.findUnique({
    where: { id },
    include: { certifications: { include: { submissions: true } } },
  });
}

export async function createStandard(data: {
  code: string;
  name: string;
  version: string;
  description?: string;
  category?: string;
  body?: string;
  actorId?: string;
}) {
  const standard = await db.standard.create({
    data: {
      code: data.code,
      name: data.name,
      version: data.version,
      description: data.description,
      category: data.category,
      body: data.body,
    },
  });
  await createAuditEvent({
    eventType: "standard.created",
    entityType: "Standard",
    entityId: standard.id,
    actorId: data.actorId,
    summary: `Standard "${data.code}" created`,
    standardId: standard.id,
  });
  return standard;
}

export async function publishStandard(id: string, actorId?: string) {
  const standard = await db.standard.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
  await createAuditEvent({
    eventType: "standard.published",
    entityType: "Standard",
    entityId: id,
    actorId,
    summary: `Standard "${standard.code}" published`,
    standardId: id,
  });
  return standard;
}

export async function listCertificationSubmissions(params: PaginationParams & { status?: string; partnerId?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", status, partnerId } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (partnerId) where.partnerId = partnerId;
  const [items, total] = await Promise.all([
    db.certificationSubmission.findMany({
      where,
      include: { definition: { include: { standard: true } }, partner: { include: { organization: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.certificationSubmission.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function approveCertification(id: string, score: number, actorId?: string) {
  const submission = await db.certificationSubmission.update({
    where: { id },
    data: { status: "approved", score, reviewedAt: new Date(), reviewedById: actorId },
  });
  await createAuditEvent({
    eventType: "certification.approved",
    entityType: "CertificationSubmission",
    entityId: id,
    actorId,
    summary: `Certification submission approved with score ${score}`,
    submissionId: id,
    partnerId: submission.partnerId,
  });
  return submission;
}

export async function rejectCertification(id: string, reason: string, actorId?: string) {
  const submission = await db.certificationSubmission.update({
    where: { id },
    data: { status: "rejected", rejectionReason: reason, reviewedAt: new Date(), reviewedById: actorId },
  });
  await createAuditEvent({
    eventType: "certification.rejected",
    entityType: "CertificationSubmission",
    entityId: id,
    actorId,
    summary: `Certification submission rejected: ${reason}`,
    submissionId: id,
    partnerId: submission.partnerId,
  });
  return submission;
}
