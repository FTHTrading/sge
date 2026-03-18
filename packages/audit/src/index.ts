// ─────────────────────────────────────────────
// SGE Alignment OS – Audit Event Utilities
// ─────────────────────────────────────────────

import { db } from "@sge/db";
import { hashAuditEvent } from "@sge/utils";

export interface CreateAuditEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  summary: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
  partnerId?: string;
  projectId?: string;
  deploymentId?: string;
  milestoneId?: string;
  planId?: string;
  conditionId?: string;
  standardId?: string;
  submissionId?: string;
  proposalId?: string;
  resolutionId?: string;
}

/**
 * Create an immutable-style audit event with a chained hash.
 * Each event's hash includes the previous event's hash for tamper evidence.
 */
export async function createAuditEvent(input: CreateAuditEventInput) {
  // Get the most recent event hash for chaining
  const lastEvent = await db.auditEvent.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });

  const now = new Date();

  const hash = hashAuditEvent({
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    summary: input.summary,
    createdAt: now,
    previousHash: lastEvent?.hash ?? undefined,
  });

  return db.auditEvent.create({
    data: {
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      summary: input.summary,
      detail: (input.detail ?? undefined) as any,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      hash,
      organizationId: input.organizationId,
      partnerId: input.partnerId,
      projectId: input.projectId,
      deploymentId: input.deploymentId,
      milestoneId: input.milestoneId,
      planId: input.planId,
      conditionId: input.conditionId,
      standardId: input.standardId,
      submissionId: input.submissionId,
      proposalId: input.proposalId,
      resolutionId: input.resolutionId,
    },
  });
}

/**
 * Verify the integrity of the audit chain.
 * Returns { valid: boolean, brokenAt?: string }
 */
export async function verifyAuditChain(limit = 1000): Promise<{
  valid: boolean;
  checked: number;
  brokenAt?: string;
}> {
  const events = await db.auditEvent.findMany({
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      eventType: true,
      entityType: true,
      entityId: true,
      summary: true,
      hash: true,
      createdAt: true,
    },
  });

  let previousHash: string | undefined;

  for (const event of events) {
    const expectedHash = hashAuditEvent({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      summary: event.summary,
      createdAt: event.createdAt,
      previousHash,
    });

    if (event.hash !== expectedHash) {
      return { valid: false, checked: events.indexOf(event), brokenAt: event.id };
    }

    previousHash = event.hash;
  }

  return { valid: true, checked: events.length };
}

/** Shorthand helpers for common audit events */
export const AuditEvents = {
  partnerCreated: (partnerId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "partner.created",
      entityType: "Partner",
      entityId: partnerId,
      actorId,
      summary: "Partner record created",
      partnerId,
    }),

  projectCreated: (projectId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "project.created",
      entityType: "Project",
      entityId: projectId,
      actorId,
      summary: "Project created",
      projectId,
    }),

  milestoneVerified: (milestoneId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "milestone.verified",
      entityType: "Milestone",
      entityId: milestoneId,
      actorId,
      summary: "Milestone verified",
      milestoneId,
    }),

  certificationApproved: (submissionId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "certification.approved",
      entityType: "CertificationSubmission",
      entityId: submissionId,
      actorId,
      summary: "Certification submission approved",
      submissionId,
    }),

  governanceProposalCreated: (proposalId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "governance.proposal_created",
      entityType: "GovernanceProposal",
      entityId: proposalId,
      actorId,
      summary: "Governance proposal created",
      proposalId,
    }),

  standardPublished: (standardId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "standard.published",
      entityType: "Standard",
      entityId: standardId,
      actorId,
      summary: "Standard published",
      standardId,
    }),

  deploymentPhaseChanged: (
    deploymentId: string,
    phase: string,
    actorId?: string
  ) =>
    createAuditEvent({
      eventType: "deployment.phase_changed",
      entityType: "Deployment",
      entityId: deploymentId,
      actorId,
      summary: `Deployment phase changed to ${phase}`,
      deploymentId,
      detail: { phase },
    }),

  documentUploaded: (docId: string, actorId?: string) =>
    createAuditEvent({
      eventType: "document.uploaded",
      entityType: "Document",
      entityId: docId,
      actorId,
      summary: "Document uploaded",
    }),
} as const;
