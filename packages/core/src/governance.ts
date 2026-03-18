import { db } from "@sge/db";
import { createAuditEvent } from "@sge/audit";
import type { PaginationParams } from "@sge/types";

export async function listProposals(params: PaginationParams & { status?: string }) {
  const { page = 1, pageSize = 20, sortBy = "createdAt", sortOrder = "desc", search, status } = params;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { committee: { contains: search, mode: "insensitive" } },
    ];
  }
  const [items, total] = await Promise.all([
    db.governanceProposal.findMany({
      where,
      include: { resolutions: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    }),
    db.governanceProposal.count({ where }),
  ]);
  return { items, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function getProposal(id: string) {
  return db.governanceProposal.findUnique({
    where: { id },
    include: { resolutions: { orderBy: { version: "desc" } } },
  });
}

export async function createProposal(data: {
  title: string;
  summary?: string;
  body?: string;
  committee?: string;
  category?: string;
  authorId?: string;
  actorId?: string;
}) {
  const proposal = await db.governanceProposal.create({
    data: {
      title: data.title,
      summary: data.summary,
      body: data.body,
      committee: data.committee,
      category: data.category,
      authorId: data.authorId ?? data.actorId,
    },
  });
  await createAuditEvent({
    eventType: "governance.proposal_created",
    entityType: "GovernanceProposal",
    entityId: proposal.id,
    actorId: data.actorId,
    summary: `Proposal "${data.title}" created`,
    proposalId: proposal.id,
  });
  return proposal;
}

export async function updateProposalStatus(id: string, status: string, actorId?: string) {
  const updateData: Record<string, unknown> = { status };
  if (status === "open") updateData.openedAt = new Date();
  if (["passed", "rejected", "withdrawn"].includes(status)) updateData.closedAt = new Date();
  if (status === "implemented") updateData.implementedAt = new Date();

  const proposal = await db.governanceProposal.update({ where: { id }, data: updateData });
  await createAuditEvent({
    eventType: `governance.proposal_${status}`,
    entityType: "GovernanceProposal",
    entityId: id,
    actorId,
    summary: `Proposal status changed to ${status}`,
    proposalId: id,
    detail: { status },
  });
  return proposal;
}

export async function createResolution(data: {
  proposalId: string;
  title: string;
  body?: string;
  actorId?: string;
}) {
  const existing = await db.governanceResolution.count({ where: { proposalId: data.proposalId } });
  const resolution = await db.governanceResolution.create({
    data: {
      proposalId: data.proposalId,
      title: data.title,
      body: data.body,
      version: existing + 1,
    },
  });
  await createAuditEvent({
    eventType: "governance.resolution_created",
    entityType: "GovernanceResolution",
    entityId: resolution.id,
    actorId: data.actorId,
    summary: `Resolution "${data.title}" created (v${resolution.version})`,
    resolutionId: resolution.id,
    proposalId: data.proposalId,
  });
  return resolution;
}

export async function publishResolution(id: string, actorId?: string) {
  const resolution = await db.governanceResolution.update({
    where: { id },
    data: { status: "published", publishedAt: new Date() },
  });
  await createAuditEvent({
    eventType: "governance.resolution_published",
    entityType: "GovernanceResolution",
    entityId: id,
    actorId,
    summary: `Resolution published`,
    resolutionId: id,
    proposalId: resolution.proposalId,
  });
  return resolution;
}
