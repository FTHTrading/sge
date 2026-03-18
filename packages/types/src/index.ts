// ─────────────────────────────────────────────
// SGE Alignment OS – Shared Types
// ─────────────────────────────────────────────

// Auth & Roles
export type Role =
  | "super_admin"
  | "foundation_admin"
  | "governance_admin"
  | "partner_admin"
  | "partner_user"
  | "certifier"
  | "researcher"
  | "public_viewer";

export const ADMIN_ROLES: Role[] = [
  "super_admin",
  "foundation_admin",
  "governance_admin",
];

export const PARTNER_ROLES: Role[] = ["partner_admin", "partner_user"];

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
  organizationId?: string | null;
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  roles?: Role[];
}

// API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

// Dashboard KPIs
export interface KpiCard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: string;
  trend?: "up" | "down" | "flat";
}

// Org Types
export type OrgType =
  | "foundation"
  | "enterprise"
  | "research"
  | "government"
  | "ngo"
  | "operator"
  | "vendor";

export type PartnerTier = "strategic" | "premier" | "standard" | "associate";
export type PartnerStatus = "active" | "pending" | "suspended" | "inactive";

// Project / Deployment
export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export type DeploymentPhase =
  | "planning"
  | "permitting"
  | "procurement"
  | "construction"
  | "commissioning"
  | "operational"
  | "decommissioned";

export type ReadinessState =
  | "not_started"
  | "in_progress"
  | "ready"
  | "blocked"
  | "complete";

// Milestones & Incentives
export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "verified"
  | "failed";

export type PlanStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type ConditionType =
  | "milestone_completion"
  | "deployment_threshold"
  | "certification_achieved"
  | "date_trigger"
  | "manual_approval"
  | "performance_metric";

export type ConditionStatus = "locked" | "unlocked" | "triggered" | "expired";

// Standards & Certification
export type StandardStatus = "draft" | "published" | "deprecated" | "archived";

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

// Governance
export type ProposalStatus =
  | "draft"
  | "open"
  | "voting"
  | "passed"
  | "rejected"
  | "withdrawn"
  | "implemented";

export type ResolutionStatus =
  | "draft"
  | "published"
  | "superseded"
  | "archived";

// Audit
export interface AuditEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  summary: string;
  detail?: Record<string, unknown>;
  organizationId?: string;
  partnerId?: string;
  projectId?: string;
}

// Table / List
export interface ColumnDef<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Status badge mapping
export interface StatusConfig {
  label: string;
  color: "green" | "yellow" | "red" | "blue" | "gray" | "purple" | "orange";
}

export const PROJECT_STATUS_MAP: Record<ProjectStatus, StatusConfig> = {
  draft: { label: "Draft", color: "gray" },
  active: { label: "Active", color: "green" },
  on_hold: { label: "On Hold", color: "yellow" },
  completed: { label: "Completed", color: "blue" },
  cancelled: { label: "Cancelled", color: "red" },
};

export const PARTNER_STATUS_MAP: Record<PartnerStatus, StatusConfig> = {
  active: { label: "Active", color: "green" },
  pending: { label: "Pending", color: "yellow" },
  suspended: { label: "Suspended", color: "orange" },
  inactive: { label: "Inactive", color: "gray" },
};

export const MILESTONE_STATUS_MAP: Record<MilestoneStatus, StatusConfig> = {
  pending: { label: "Pending", color: "gray" },
  in_progress: { label: "In Progress", color: "blue" },
  completed: { label: "Completed", color: "green" },
  verified: { label: "Verified", color: "purple" },
  failed: { label: "Failed", color: "red" },
};
