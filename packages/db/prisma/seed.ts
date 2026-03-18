import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";

function auditEvent(
  eventType: string,
  entityType: string,
  entityId: string,
  summary: string,
  detail: Record<string, unknown> = {}
) {
  const hash = sha256(
    `${prevHash}|${eventType}|${entityType}|${entityId}|${JSON.stringify(detail)}`
  );
  const event = {
    eventType,
    entityType,
    entityId,
    summary,
    detail: detail as object,
    hash,
    actorId: null as string | null,
  };
  prevHash = hash;
  return event;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding SGE Alignment OS database...\n");

  // ── CLEAN ──────────────────────────────────
  await prisma.claimReceipt.deleteMany();
  await prisma.transactionLog.deleteMany();
  await prisma.walletClaim.deleteMany();
  await prisma.allowanceCheck.deleteMany();
  await prisma.claimRule.deleteMany();
  await prisma.claimContract.deleteMany();
  await prisma.tokenContract.deleteMany();
  await prisma.blockchainNetwork.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.governanceResolution.deleteMany();
  await prisma.governanceProposal.deleteMany();
  await prisma.proofArtifact.deleteMany();
  await prisma.certificationSubmission.deleteMany();
  await prisma.certificationDefinition.deleteMany();
  await prisma.incentiveCondition.deleteMany();
  await prisma.incentivePlan.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.standard.deleteMany();
  await prisma.report.deleteMany();
  await prisma.document.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log("  ✓ Cleaned existing data");

  // ── USERS ──────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      name: "Maria Alvarado",
      email: "maria@sge.foundation",
      role: "super_admin",
    },
  });
  const admin2 = await prisma.user.create({
    data: {
      name: "James Chen",
      email: "james@sge.foundation",
      role: "foundation_admin",
    },
  });
  const auditorUser = await prisma.user.create({
    data: {
      name: "Elena Rodriguez",
      email: "elena@arctech.co",
      role: "certifier",
    },
  });
  const partnerUsers = await Promise.all([
    prisma.user.create({ data: { name: "Sarah Park", email: "sarah@meridian-solar.com", role: "partner_admin" } }),
    prisma.user.create({ data: { name: "David Osei", email: "david@greenpeak.com", role: "partner_admin" } }),
    prisma.user.create({ data: { name: "Anya Petrov", email: "anya@volterra.io", role: "partner_user" } }),
    prisma.user.create({ data: { name: "Marcus Williams", email: "marcus@solisnetwork.com", role: "partner_user" } }),
    prisma.user.create({ data: { name: "Lin Wei", email: "lin@sunforge.cn", role: "partner_admin" } }),
    prisma.user.create({ data: { name: "Kevin Durand", email: "kevin@greenwatt.fr", role: "partner_user" } }),
    prisma.user.create({ data: { name: "Thomas Bergmann", email: "thomas@eu-energy.de", role: "public_viewer" } }),
  ]);
  console.log(`  ✓ Created ${3 + partnerUsers.length} users`);

  // ── ORGANIZATIONS ──────────────────────────
  const orgs = await Promise.all([
    prisma.organization.create({ data: { name: "SGE Foundation", slug: "sge-foundation", type: "foundation" } }),
    prisma.organization.create({ data: { name: "Meridian Solar Group", slug: "meridian-solar", type: "enterprise" } }),
    prisma.organization.create({ data: { name: "GreenPeak Energy", slug: "greenpeak-energy", type: "enterprise" } }),
    prisma.organization.create({ data: { name: "Volterra Systems", slug: "volterra-systems", type: "enterprise" } }),
    prisma.organization.create({ data: { name: "Solis Network", slug: "solis-network", type: "ngo" } }),
    prisma.organization.create({ data: { name: "SunForge Ltd", slug: "sunforge-ltd", type: "enterprise" } }),
    prisma.organization.create({ data: { name: "GreenWatt France", slug: "greenwatt-france", type: "enterprise" } }),
    prisma.organization.create({ data: { name: "Arctech Partners", slug: "arctech-partners", type: "vendor" } }),
  ]);
  console.log(`  ✓ Created ${orgs.length} organizations`);

  // ── PARTNERS ───────────────────────────────
  const partners = await Promise.all([
    prisma.partner.create({
      data: {
        organizationId: orgs[1]!.id,
        tier: "strategic",
        status: "active",
        region: "North America",
        contactName: "Sarah Park",
        contactEmail: "partners@meridian-solar.com",
        commitmentSummary: "Leading solar energy developer with 2.4 GW capacity across 12 states.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[2]!.id,
        tier: "strategic",
        status: "active",
        region: "Sub-Saharan Africa",
        contactName: "David Osei",
        contactEmail: "info@greenpeak.com",
        commitmentSummary: "Renewable energy infrastructure across West and East Africa.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[3]!.id,
        tier: "premier",
        status: "active",
        region: "Europe",
        contactName: "Anya Petrov",
        contactEmail: "hello@volterra.io",
        commitmentSummary: "Grid-scale battery storage and energy management systems.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[4]!.id,
        tier: "premier",
        status: "active",
        region: "Latin America",
        contactName: "Marcus Williams",
        contactEmail: "contact@solisnetwork.com",
        commitmentSummary: "Community solar cooperative serving rural Latin America.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[5]!.id,
        tier: "standard",
        status: "active",
        region: "Asia Pacific",
        contactName: "Lin Wei",
        contactEmail: "partner@sunforge.cn",
        commitmentSummary: "Solar panel manufacturing and project development in APAC.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[6]!.id,
        tier: "standard",
        status: "active",
        region: "Europe",
        contactName: "Kevin Durand",
        contactEmail: "partenaires@greenwatt.fr",
        commitmentSummary: "Wind and solar installations across France and Benelux.",
      },
    }),
    prisma.partner.create({
      data: {
        organizationId: orgs[7]!.id,
        tier: "associate",
        status: "pending",
        region: "Middle East",
        contactName: "Ali Hassan",
        contactEmail: "clean@arctech.co",
        commitmentSummary: "Emerging cleantech advisory and project development firm.",
      },
    }),
  ]);
  console.log(`  ✓ Created ${partners.length} partners`);

  // ── PROJECTS ───────────────────────────────
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: "Arizona Solar Corridor",
        slug: "arizona-solar-corridor",
        partnerId: partners[0]!.id,
        status: "active",
        region: "Arizona, US",
        country: "US",
        energyGoalMW: 340,
        description: "Large-scale photovoltaic installation spanning 1,200 acres in southern Arizona.",
        impactSummary: "Utility-scale PV powering 85,000 homes.",
        startDate: new Date("2023-06-01"),
        targetDate: new Date("2025-12-31"),
      },
    }),
    prisma.project.create({
      data: {
        name: "Lagos Microgrid Initiative",
        slug: "lagos-microgrid",
        partnerId: partners[1]!.id,
        status: "active",
        region: "Lagos, Nigeria",
        country: "NG",
        energyGoalMW: 45,
        description: "Community-scale solar microgrids serving 200,000+ residents in Lagos metropolitan area.",
        impactSummary: "Solar microgrid network for underserved communities.",
      },
    }),
    prisma.project.create({
      data: {
        name: "GreenPeak Wind Farm",
        slug: "greenpeak-wind-farm",
        partnerId: partners[1]!.id,
        status: "draft",
        region: "Kenya",
        country: "KE",
        energyGoalMW: 120,
        description: "Wind energy installation in the Kenyan Rift Valley.",
      },
    }),
    prisma.project.create({
      data: {
        name: "Baltic Grid Storage",
        slug: "baltic-grid-storage",
        partnerId: partners[2]!.id,
        status: "active",
        region: "Estonia",
        country: "EE",
        energyGoalMW: 80,
        description: "Grid-scale lithium-ion battery storage for Baltic grid stabilization.",
      },
    }),
    prisma.project.create({
      data: {
        name: "Andes Community Solar",
        slug: "andes-community-solar",
        partnerId: partners[3]!.id,
        status: "active",
        region: "Colombia",
        country: "CO",
        energyGoalMW: 25,
        description: "Distributed solar installations for rural communities in the Colombian Andes.",
      },
    }),
    prisma.project.create({
      data: {
        name: "Guangdong Solar Farm",
        slug: "guangdong-solar-farm",
        partnerId: partners[4]!.id,
        status: "completed",
        region: "Guangdong, China",
        country: "CN",
        energyGoalMW: 200,
        description: "Innovative floating solar installation on reservoir surfaces.",
      },
    }),
  ]);
  console.log(`  ✓ Created ${projects.length} projects`);

  // ── DEPLOYMENTS ────────────────────────────
  const deployments = await Promise.all([
    prisma.deployment.create({
      data: {
        name: "ASC Phase 1",
        projectId: projects[0]!.id,
        phase: "operational",
        readinessState: "complete",
        energyOutputMW: 150,
        description: "Phase 1 operational cluster — 150 MW utility PV.",
        region: "Pima County, AZ",
      },
    }),
    prisma.deployment.create({
      data: {
        name: "ASC Phase 2",
        projectId: projects[0]!.id,
        phase: "commissioning",
        readinessState: "in_progress",
        energyOutputMW: 190,
        description: "Phase 2 under commissioning — 190 MW expansion.",
        region: "Pima County, AZ",
      },
    }),
    prisma.deployment.create({
      data: {
        name: "Lagos Grid Alpha",
        projectId: projects[1]!.id,
        phase: "operational",
        readinessState: "complete",
        energyOutputMW: 20,
        description: "First microgrid cluster — Ikeja axis.",
        region: "Lagos, Nigeria",
      },
    }),
    prisma.deployment.create({
      data: {
        name: "Lagos Grid Beta",
        projectId: projects[1]!.id,
        phase: "construction",
        readinessState: "in_progress",
        energyOutputMW: 25,
        description: "Second microgrid cluster — Lekki corridor.",
        region: "Lagos, Nigeria",
      },
    }),
    prisma.deployment.create({
      data: {
        name: "Baltic Storage Unit 1",
        projectId: projects[3]!.id,
        phase: "operational",
        readinessState: "complete",
        energyOutputMW: 40,
        description: "Grid-scale Li-ion battery bank — Tallinn substation.",
        region: "Tallinn, Estonia",
      },
    }),
    prisma.deployment.create({
      data: {
        name: "Andes Village Cluster",
        projectId: projects[4]!.id,
        phase: "operational",
        readinessState: "complete",
        energyOutputMW: 12,
        description: "Community solar distribution — Boyacá department.",
        region: "Boyacá, Colombia",
      },
    }),
  ]);
  console.log(`  ✓ Created ${deployments.length} deployments`);

  // ── MILESTONES ─────────────────────────────
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        name: "Site Survey Complete",
        description: "Environmental and geological survey for Phase 2 completed and approved.",
        projectId: projects[0]!.id,
        status: "verified",
        dueDate: new Date("2024-01-15"),
        weight: 1,
        verifiedAt: new Date("2024-01-12"),
        verifiedById: auditorUser.id,
        evidenceNotes: "Survey report: survey-report-asc-p2.pdf, GIS data verified.",
      },
    }),
    prisma.milestone.create({
      data: {
        name: "Grid Connection Approval",
        description: "Utility interconnection agreement signed and approved.",
        projectId: projects[0]!.id,
        status: "verified",
        dueDate: new Date("2024-02-28"),
        weight: 2,
        verifiedAt: new Date("2024-02-25"),
        verifiedById: auditorUser.id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "Panel Installation 50%",
        description: "Half of all solar panels installed and connected.",
        projectId: projects[0]!.id,
        status: "in_progress",
        dueDate: new Date("2024-04-30"),
        weight: 3,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "Community Engagement Complete",
        description: "All community engagement sessions delivered in target areas.",
        projectId: projects[1]!.id,
        status: "verified",
        dueDate: new Date("2024-01-31"),
        weight: 1,
        verifiedAt: new Date("2024-01-28"),
        verifiedById: admin2.id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "Microgrid Alpha Live",
        description: "First microgrid cluster operational and serving residents.",
        projectId: projects[1]!.id,
        status: "verified",
        dueDate: new Date("2024-03-15"),
        weight: 3,
        verifiedAt: new Date("2024-03-10"),
        verifiedById: auditorUser.id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "EIA Approval",
        description: "Environmental Impact Assessment approved by regulatory body.",
        projectId: projects[2]!.id,
        status: "pending",
        dueDate: new Date("2024-05-30"),
        weight: 2,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "Battery Cell Testing",
        description: "Full cycle testing of battery storage cells completed.",
        projectId: projects[3]!.id,
        status: "verified",
        dueDate: new Date("2024-02-15"),
        weight: 2,
        verifiedAt: new Date("2024-02-14"),
        verifiedById: auditorUser.id,
      },
    }),
    prisma.milestone.create({
      data: {
        name: "First Energy Export",
        description: "First successful energy export to national grid.",
        projectId: projects[3]!.id,
        status: "in_progress",
        dueDate: new Date("2024-04-15"),
        weight: 3,
      },
    }),
  ]);
  console.log(`  ✓ Created ${milestones.length} milestones`);

  // ── INCENTIVE PLANS ────────────────────────
  const incentivePlans = await Promise.all([
    prisma.incentivePlan.create({
      data: {
        name: "Early Adopter Program",
        description: "Rewards for partners who join and deploy within the first year.",
        partnerId: partners[0]!.id,
        status: "active",
        conditions: {
          create: [
            { conditionType: "milestone_completion", threshold: 1, status: "triggered", description: "Complete onboarding" },
            { conditionType: "deployment_threshold", threshold: 1, status: "triggered", description: "First deployment live" },
            { conditionType: "certification_achieved", threshold: 1, status: "unlocked", description: "Pass initial certification" },
          ],
        },
      },
    }),
    prisma.incentivePlan.create({
      data: {
        name: "Capacity Growth Bonus",
        description: "Incentives for partners achieving capacity deployment milestones.",
        partnerId: partners[1]!.id,
        status: "active",
        conditions: {
          create: [
            { conditionType: "deployment_threshold", threshold: 50, status: "unlocked", description: "Deploy 50 MW" },
            { conditionType: "deployment_threshold", threshold: 100, status: "locked", description: "Deploy 100 MW" },
            { conditionType: "deployment_threshold", threshold: 500, status: "locked", description: "Deploy 500 MW" },
          ],
        },
      },
    }),
    prisma.incentivePlan.create({
      data: {
        name: "Community Impact Award",
        description: "Recognition for projects with measurable community impact.",
        partnerId: partners[3]!.id,
        status: "active",
        conditions: {
          create: [
            { conditionType: "performance_metric", threshold: 10000, status: "unlocked", description: "Serve 10,000 residents" },
            { conditionType: "performance_metric", threshold: 90, status: "triggered", description: "Community satisfaction > 90%" },
          ],
        },
      },
    }),
    prisma.incentivePlan.create({
      data: {
        name: "Standards Excellence",
        description: "Incentives for maintaining high certification scores.",
        partnerId: partners[2]!.id,
        status: "active",
        conditions: {
          create: [
            { conditionType: "certification_achieved", threshold: 3, status: "unlocked", description: "Pass 3 certifications" },
            { conditionType: "performance_metric", threshold: 100, status: "triggered", description: "Zero non-conformities" },
          ],
        },
      },
    }),
    prisma.incentivePlan.create({
      data: {
        name: "Regional Pioneer Program",
        description: "Incentives for first partners deploying in underserved regions.",
        partnerId: partners[4]!.id,
        status: "active",
        conditions: {
          create: [
            { conditionType: "manual_approval", threshold: 1, status: "triggered", description: "Deploy in new region" },
            { conditionType: "performance_metric", threshold: 80, status: "triggered", description: "Local workforce > 80%" },
          ],
        },
      },
    }),
    prisma.incentivePlan.create({
      data: {
        name: "Governance Participation",
        description: "Rewards for active participation in governance processes.",
        partnerId: partners[5]!.id,
        status: "draft",
        conditions: {
          create: [
            { conditionType: "performance_metric", threshold: 5, status: "locked", description: "Vote on 5 proposals" },
            { conditionType: "performance_metric", threshold: 1, status: "locked", description: "Author 1 proposal" },
          ],
        },
      },
    }),
  ]);
  console.log(`  ✓ Created ${incentivePlans.length} incentive plans with conditions`);

  // ── STANDARDS ──────────────────────────────
  const standards = await Promise.all([
    prisma.standard.create({
      data: {
        code: "SGE-STD-001",
        name: "Solar Installation Quality Framework",
        version: "2.1",
        description: "Comprehensive quality standards for utility-scale solar PV installations.",
        category: "Solar",
        status: "published",
        publishedAt: new Date("2023-06-15"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-002",
        name: "Wind Energy Assessment Protocol",
        version: "1.4",
        description: "Methodology for wind resource assessment and turbine site selection.",
        category: "Wind",
        status: "published",
        publishedAt: new Date("2023-09-01"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-003",
        name: "Battery Storage Safety Standard",
        version: "1.2",
        description: "Safety requirements for grid-scale battery energy storage systems.",
        category: "Storage",
        status: "published",
        publishedAt: new Date("2023-11-20"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-004",
        name: "Community Solar Guidelines",
        version: "1.0",
        description: "Best practices for community-owned solar installations.",
        category: "Solar",
        status: "published",
        publishedAt: new Date("2024-01-10"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-005",
        name: "Carbon Offset Verification Protocol",
        version: "3.0",
        description: "Methodology for verifying and certifying carbon offset claims.",
        category: "Carbon",
        status: "published",
        publishedAt: new Date("2024-02-01"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-006",
        name: "Microgrid Interoperability Standard",
        version: "1.1",
        description: "Technical standards for microgrid interconnection and interoperability.",
        category: "Grid",
        status: "published",
        publishedAt: new Date("2024-02-20"),
      },
    }),
    prisma.standard.create({
      data: {
        code: "SGE-STD-007",
        name: "Floating Solar Installation Standard",
        version: "0.9",
        description: "Draft standard for floating photovoltaic systems on water bodies.",
        category: "Solar",
        status: "draft",
      },
    }),
  ]);
  console.log(`  ✓ Created ${standards.length} standards`);

  // ── CERTIFICATION DEFINITIONS ──────────────
  const certDefs = await Promise.all([
    prisma.certificationDefinition.create({
      data: {
        standardId: standards[0]!.id,
        name: "SGE Solar Quality Certification",
        description: "Certification for solar installations meeting SGE-STD-001 requirements.",
        criteria: { clauses: "all", audit: true, inspection: true },
      },
    }),
    prisma.certificationDefinition.create({
      data: {
        standardId: standards[2]!.id,
        name: "SGE Battery Safety Certification",
        description: "Safety certification for grid-scale battery storage systems.",
        criteria: { clauses: "all", safetyAudit: true, stressTest: true },
      },
    }),
    prisma.certificationDefinition.create({
      data: {
        standardId: standards[4]!.id,
        name: "SGE Carbon Offset Verification",
        description: "Third-party verified carbon offset certification.",
        criteria: { clauses: "all", thirdPartyAudit: true, annualReview: true },
      },
    }),
  ]);

  // ── CERTIFICATION SUBMISSIONS ──────────────
  await Promise.all([
    prisma.certificationSubmission.create({
      data: {
        definitionId: certDefs[0]!.id,
        partnerId: partners[0]!.id,
        status: "approved",
        evidenceFiles: { inspectionReport: "insp-2024-001.pdf", auditScore: 96 },
        reviewedAt: new Date("2024-02-15"),
        reviewedById: auditorUser.id,
        notes: "All clauses met. Excellent documentation.",
        score: 96,
      },
    }),
    prisma.certificationSubmission.create({
      data: {
        definitionId: certDefs[0]!.id,
        partnerId: partners[4]!.id,
        status: "under_review",
        evidenceFiles: { inspectionReport: "insp-2024-012.pdf" },
      },
    }),
    prisma.certificationSubmission.create({
      data: {
        definitionId: certDefs[1]!.id,
        partnerId: partners[2]!.id,
        status: "approved",
        evidenceFiles: { safetyAudit: "safety-2024-003.pdf", stressTestResults: "pass" },
        reviewedAt: new Date("2024-03-01"),
        reviewedById: auditorUser.id,
        notes: "Meets all safety requirements. Approved.",
        score: 98,
      },
    }),
    prisma.certificationSubmission.create({
      data: {
        definitionId: certDefs[2]!.id,
        partnerId: partners[3]!.id,
        status: "submitted",
        evidenceFiles: { offsetCalculation: "offset-calc-2024-007.xlsx" },
      },
    }),
    prisma.certificationSubmission.create({
      data: {
        definitionId: certDefs[2]!.id,
        partnerId: partners[1]!.id,
        status: "rejected",
        evidenceFiles: { offsetCalculation: "offset-calc-2024-004.xlsx" },
        reviewedAt: new Date("2024-02-28"),
        reviewedById: auditorUser.id,
        rejectionReason: "Baseline methodology needs revision per clause 4.2.1.",
      },
    }),
  ]);
  console.log("  ✓ Created certification definitions and submissions");

  // ── GOVERNANCE PROPOSALS ───────────────────
  const proposals = await Promise.all([
    prisma.governanceProposal.create({
      data: {
        title: "Carbon Credit Verification Protocol Update",
        summary: "Update SGE-STD-005 to align with latest IPCC guidelines.",
        category: "standard_amendment",
        authorId: adminUser.id,
        status: "voting",
        openedAt: new Date("2024-03-01"),
      },
    }),
    prisma.governanceProposal.create({
      data: {
        title: "APAC Regional Expansion Framework",
        summary: "Establish framework for accelerated partner onboarding in Asia-Pacific.",
        category: "policy_change",
        authorId: admin2.id,
        status: "voting",
        openedAt: new Date("2024-03-05"),
      },
    }),
    prisma.governanceProposal.create({
      data: {
        title: "Community Solar Incentive Program",
        summary: "Create tiered incentive program for community solar projects.",
        category: "incentive_program",
        authorId: adminUser.id,
        status: "passed",
        openedAt: new Date("2024-02-01"),
        closedAt: new Date("2024-02-28"),
      },
    }),
    prisma.governanceProposal.create({
      data: {
        title: "Annual Audit Cadence Increase",
        summary: "Increase audit frequency from annual to semi-annual for Strategic partners.",
        category: "operational",
        authorId: auditorUser.id,
        status: "passed",
        openedAt: new Date("2024-01-15"),
        closedAt: new Date("2024-02-15"),
      },
    }),
    prisma.governanceProposal.create({
      data: {
        title: "Floating Solar Standard Ratification",
        summary: "Ratify SGE-STD-007 as an official published standard.",
        category: "standard_ratification",
        authorId: admin2.id,
        status: "draft",
      },
    }),
    prisma.governanceProposal.create({
      data: {
        title: "Partner Tier Reassessment Criteria",
        summary: "Define objective criteria for annual partner tier reassessment.",
        category: "policy_change",
        authorId: adminUser.id,
        status: "rejected",
        openedAt: new Date("2024-02-01"),
        closedAt: new Date("2024-03-01"),
      },
    }),
  ]);

  // ── GOVERNANCE RESOLUTIONS ─────────────────
  await Promise.all([
    prisma.governanceResolution.create({
      data: {
        title: "Community Solar Incentive Program Established",
        proposalId: proposals[2]!.id,
        status: "published",
        publishedAt: new Date("2024-03-15"),
      },
    }),
    prisma.governanceResolution.create({
      data: {
        title: "Semi-Annual Audit Cadence for Strategic Partners",
        proposalId: proposals[3]!.id,
        status: "published",
        publishedAt: new Date("2024-03-01"),
      },
    }),
  ]);
  console.log(`  ✓ Created ${proposals.length} governance proposals and 2 resolutions`);

  // ── BLOCKCHAIN / CLAIM INFRASTRUCTURE ──────
  const ethMainnet = await prisma.blockchainNetwork.create({
    data: {
      name: "Ethereum Mainnet",
      chainId: 1,
      rpcUrl: "https://eth.llamarpc.com",
      explorerUrl: "https://etherscan.io",
      isTestnet: false,
      isActive: true,
    },
  });

  const usdc = await prisma.tokenContract.create({
    data: {
      networkId: ethMainnet.id,
      symbol: "USDC",
      name: "USD Coin",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      isSupported: true,
    },
  });

  const usdt = await prisma.tokenContract.create({
    data: {
      networkId: ethMainnet.id,
      symbol: "USDT",
      name: "Tether USD",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      decimals: 6,
      isSupported: true,
    },
  });

  const sgeClaim = await prisma.claimContract.create({
    data: {
      networkId: ethMainnet.id,
      name: "SGEClaim",
      address: "0x4BFeF695a5f85a65E1Aa6015439f317494477D09",
      abi: [
        "function claimWithUSDC() external",
        "function claimWithUSDT() external",
        "function claimSGE() external",
      ],
      isActive: true,
      notes: "SGE token claim contract — 100 USDC/USDT per 1000 SGE.",
    },
  });

  await Promise.all([
    prisma.claimRule.create({
      data: {
        contractId: sgeClaim.id,
        tokenContractId: usdc.id,
        claimAmount: "100000000",
        claimAmountHuman: 100.0,
        isActive: true,
        description: "Pay 100 USDC to claim 1000 SGE tokens",
      },
    }),
    prisma.claimRule.create({
      data: {
        contractId: sgeClaim.id,
        tokenContractId: usdt.id,
        claimAmount: "100000000",
        claimAmountHuman: 100.0,
        isActive: true,
        description: "Pay 100 USDT to claim 1000 SGE tokens",
      },
    }),
  ]);
  console.log("  ✓ Created blockchain network, token contracts, claim contract, and claim rules");

  // ── AUDIT EVENTS (chain-linked) ────────────
  const auditData = [
    auditEvent("system", "system", "core", "System initialized", { version: "1.0.0" }),
    auditEvent("partner", "partner", partners[0]!.id, "Partner Meridian Solar Group created", { org: "Meridian Solar Group" }),
    auditEvent("partner", "partner", partners[1]!.id, "Partner GreenPeak Energy created", { org: "GreenPeak Energy" }),
    auditEvent("partner", "partner", partners[2]!.id, "Partner Volterra Systems created", { org: "Volterra Systems" }),
    auditEvent("project", "project", projects[0]!.id, "Project Arizona Solar Corridor created"),
    auditEvent("project", "project", projects[1]!.id, "Project Lagos Microgrid Initiative created"),
    auditEvent("deployment", "deployment", deployments[0]!.id, "Deployment ASC Phase 1 created"),
    auditEvent("deployment", "deployment", deployments[0]!.id, "Deployment ASC Phase 1 marked operational", { phase: "operational" }),
    auditEvent("milestone", "milestone", milestones[0]!.id, "Milestone Site Survey Complete verified"),
    auditEvent("milestone", "milestone", milestones[1]!.id, "Milestone Grid Connection Approval verified"),
    auditEvent("standard", "standard", standards[0]!.id, "Standard SGE-STD-001 published"),
    auditEvent("standard", "standard", standards[4]!.id, "Standard SGE-STD-005 published"),
    auditEvent("certification", "certification_submission", "seed-cert-1", "Certification submitted for Meridian Solar"),
    auditEvent("certification", "certification_submission", "seed-cert-1", "Certification approved for Meridian Solar"),
    auditEvent("governance", "proposal", proposals[0]!.id, "Proposal Carbon Credit Verification Protocol Update created"),
    auditEvent("governance", "proposal", proposals[1]!.id, "Proposal APAC Regional Expansion Framework created"),
    auditEvent("governance", "proposal", proposals[2]!.id, "Proposal Community Solar Incentive Program passed"),
    auditEvent("governance", "resolution", "seed-res-1", "Resolution Community Solar Incentive Program Established published"),
    auditEvent("incentive", "incentive_plan", incentivePlans[0]!.id, "Incentive plan Early Adopter Program created"),
    auditEvent("incentive", "incentive_condition", "seed-cond-1", "Incentive condition first deployment triggered"),
  ];

  await prisma.auditEvent.createMany({ data: auditData });
  console.log(`  ✓ Created ${auditData.length} chain-linked audit events`);

  console.log("\n✅ Seed complete! Database populated with sample data.\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
