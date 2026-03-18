import * as React from "react";
import { cn } from "../lib/utils";
import { Badge } from "./badge";

const STATUS_VARIANTS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "warning" | "info" | "purple" }> = {
  // Project
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  on_hold: { label: "On Hold", variant: "warning" },
  completed: { label: "Completed", variant: "info" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  // Partner
  pending: { label: "Pending", variant: "warning" },
  suspended: { label: "Suspended", variant: "destructive" },
  inactive: { label: "Inactive", variant: "secondary" },
  // Milestone
  in_progress: { label: "In Progress", variant: "info" },
  verified: { label: "Verified", variant: "purple" },
  failed: { label: "Failed", variant: "destructive" },
  // Governance
  open: { label: "Open", variant: "default" },
  voting: { label: "Voting", variant: "info" },
  passed: { label: "Passed", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  withdrawn: { label: "Withdrawn", variant: "secondary" },
  implemented: { label: "Implemented", variant: "purple" },
  // Standards
  published: { label: "Published", variant: "default" },
  deprecated: { label: "Deprecated", variant: "warning" },
  archived: { label: "Archived", variant: "secondary" },
  // Certification
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under Review", variant: "warning" },
  approved: { label: "Approved", variant: "default" },
  expired: { label: "Expired", variant: "secondary" },
  // Incentive conditions
  locked: { label: "Locked", variant: "secondary" },
  unlocked: { label: "Unlocked", variant: "info" },
  triggered: { label: "Triggered", variant: "default" },
  // Deployment
  planning: { label: "Planning", variant: "secondary" },
  permitting: { label: "Permitting", variant: "info" },
  procurement: { label: "Procurement", variant: "info" },
  construction: { label: "Construction", variant: "warning" },
  commissioning: { label: "Commissioning", variant: "purple" },
  operational: { label: "Operational", variant: "default" },
  decommissioned: { label: "Decommissioned", variant: "secondary" },
  // Readiness
  not_started: { label: "Not Started", variant: "secondary" },
  ready: { label: "Ready", variant: "default" },
  blocked: { label: "Blocked", variant: "destructive" },
  complete: { label: "Complete", variant: "default" },
  // Incentive plan
  paused: { label: "Paused", variant: "warning" },
  // Resolution
  superseded: { label: "Superseded", variant: "warning" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_VARIANTS[status] ?? { label: status.replace(/_/g, " "), variant: "secondary" as const };
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {config.label}
    </Badge>
  );
}
