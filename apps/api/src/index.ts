import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { prisma } from "@sge/db";

const app = express();
const PORT = process.env.API_PORT ?? 4000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("combined"));

// ---------------------------------------------------------------------------
//  Health
// ---------------------------------------------------------------------------
app.get("/health", async (_req, res) => {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: { connected: true, latencyMs: latency },
    });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});

// ---------------------------------------------------------------------------
//  Partners
// ---------------------------------------------------------------------------
app.get("/v1/partners", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.partner.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { projects: true } } },
    }),
    prisma.partner.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get("/v1/partners/:id", async (req, res) => {
  const partner = await prisma.partner.findUnique({
    where: { id: req.params.id },
    include: { projects: true, organization: true },
  });
  if (!partner) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: partner });
});

// ---------------------------------------------------------------------------
//  Projects
// ---------------------------------------------------------------------------
app.get("/v1/projects", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { partner: { select: { organization: { select: { name: true } }, tier: true } }, _count: { select: { deployments: true, milestones: true } } },
    }),
    prisma.project.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get("/v1/projects/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { partner: true, deployments: true, milestones: true },
  });
  if (!project) return res.status(404).json({ ok: false, error: "Not found" });
  res.json({ ok: true, data: project });
});

// ---------------------------------------------------------------------------
//  Deployments
// ---------------------------------------------------------------------------
app.get("/v1/deployments", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.deployment.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { project: { select: { name: true, slug: true } } },
    }),
    prisma.deployment.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------------
//  Milestones
// ---------------------------------------------------------------------------
app.get("/v1/milestones", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [data, total] = await Promise.all([
    prisma.milestone.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dueDate: "asc" },
      include: { project: { select: { name: true, slug: true } } },
    }),
    prisma.milestone.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------------
//  Standards
// ---------------------------------------------------------------------------
app.get("/v1/standards", async (_req, res) => {
  const data = await prisma.standard.findMany({
    orderBy: { publishedAt: "desc" },
    include: { _count: { select: { certifications: true } } },
  });
  res.json({ ok: true, data });
});

// ---------------------------------------------------------------------------
//  Governance
// ---------------------------------------------------------------------------
app.get("/v1/governance/proposals", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const [data, total] = await Promise.all([
    prisma.governanceProposal.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.governanceProposal.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

app.get("/v1/governance/resolutions", async (_req, res) => {
  const data = await prisma.governanceResolution.findMany({
    orderBy: { publishedAt: "desc" },
    include: { proposal: { select: { title: true } } },
  });
  res.json({ ok: true, data });
});

// ---------------------------------------------------------------------------
//  Audit
// ---------------------------------------------------------------------------
app.get("/v1/audit", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

  const [data, total] = await Promise.all([
    prisma.auditEvent.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditEvent.count(),
  ]);

  res.json({ ok: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

// ---------------------------------------------------------------------------
//  Dashboard (aggregated)
// ---------------------------------------------------------------------------
app.get("/v1/dashboard", async (_req, res) => {
  const [partners, projects, deployments, milestones, proposals, standards] = await Promise.all([
    prisma.partner.count(),
    prisma.project.count(),
    prisma.deployment.count(),
    prisma.milestone.count(),
    prisma.governanceProposal.count(),
    prisma.standard.count(),
  ]);

  const capacity = await prisma.deployment.aggregate({ _sum: { energyOutputMW: true } });

  res.json({
    ok: true,
    data: {
      partners,
      projects,
      deployments,
      milestones,
      proposals,
      standards,
      totalCapacityMW: capacity._sum?.energyOutputMW ?? 0,
    },
  });
});

// ---------------------------------------------------------------------------
//  404 catch-all
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "Endpoint not found" });
});

// ---------------------------------------------------------------------------
//  Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n  🚀 SGE API server running on http://localhost:${PORT}\n`);
});

export default app;
