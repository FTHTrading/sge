import { NextRequest } from "next/server";
import { prisma } from "@sge/db";
import { ok, serverError } from "../_helpers";

/**
 * GET /api/health
 * Simple health check endpoint
 */
export async function GET(_req: NextRequest) {
  try {
    // Verify database connectivity
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - start;

    // Get audit chain stats
    const auditCount = await prisma.auditEvent.count();

    return ok({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      services: {
        database: {
          status: "connected",
          latencyMs: dbLatencyMs,
        },
        auditChain: {
          eventCount: auditCount,
          status: "active",
        },
      },
      environment: process.env.NODE_ENV ?? "development",
    });
  } catch (error) {
    console.error("GET /api/health error:", error);
    return serverError("Service unhealthy");
  }
}
