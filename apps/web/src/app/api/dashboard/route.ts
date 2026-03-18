import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, serverError } from "../_helpers";

/**
 * GET /api/dashboard
 * Returns aggregated statistics for the executive dashboard
 */
export async function GET(_req: NextRequest) {
  try {
    const [
      partnerCount,
      projectCount,
      deploymentCount,
      milestoneCount,
      proposalCount,
      standardCount,
      certSubmissionCount,
      auditEventCount,
      recentAuditEvents,
      recentPartners,
    ] = await Promise.all([
      prisma.partner.count(),
      prisma.project.count(),
      prisma.deployment.count(),
      prisma.milestone.count(),
      prisma.governanceProposal.count(),
      prisma.standard.count(),
      prisma.certificationSubmission.count(),
      prisma.auditEvent.count(),
      prisma.auditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.partner.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, tier: true, status: true, createdAt: true, organization: { select: { name: true } } },
      }),
    ]);

    // Aggregated energy output
    const capacityAgg = await prisma.deployment.aggregate({
      _sum: { energyOutputMW: true },
    });

    // Status breakdowns
    const partnersByStatus = await prisma.partner.groupBy({
      by: ["status"],
      _count: true,
    });

    const projectsByStatus = await prisma.project.groupBy({
      by: ["status"],
      _count: true,
    });

    const milestonesByStatus = await prisma.milestone.groupBy({
      by: ["status"],
      _count: true,
    });

    return ok({
      kpis: {
        partners: partnerCount,
        projects: projectCount,
        deployments: deploymentCount,
        milestones: milestoneCount,
        proposals: proposalCount,
        standards: standardCount,
        certifications: certSubmissionCount,
        auditEvents: auditEventCount,
        totalCapacityMW: capacityAgg._sum.energyOutputMW ?? 0,
      },
      breakdowns: {
        partnersByStatus,
        projectsByStatus,
        milestonesByStatus,
      },
      recent: {
        auditEvents: recentAuditEvents,
        partners: recentPartners,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return serverError();
  }
}
