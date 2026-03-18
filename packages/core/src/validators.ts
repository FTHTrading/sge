import { z } from "zod";

export const createPartnerSchema = z.object({
  organizationId: z.string().min(1),
  tier: z.enum(["strategic", "premier", "standard", "associate"]).default("standard"),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  region: z.string().optional(),
  commitmentSummary: z.string().optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial().extend({
  status: z.enum(["active", "pending", "suspended", "inactive"]).optional(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  partnerId: z.string().optional(),
  energyGoalMW: z.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  targetDate: z.coerce.date().optional(),
});

export const createMilestoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
  deploymentId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  weight: z.number().positive().default(1.0),
});

export const createStandardSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  body: z.string().optional(),
});

export const createProposalSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().optional(),
  body: z.string().optional(),
  committee: z.string().optional(),
  category: z.string().optional(),
});

export const createIncentivePlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  partnerId: z.string().min(1),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  totalUnits: z.number().positive().optional(),
  currency: z.string().default("USDC"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});
