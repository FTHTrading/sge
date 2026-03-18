import type { Role } from "@sge/types";

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  foundation_admin: 90,
  governance_admin: 80,
  partner_admin: 60,
  partner_user: 50,
  certifier: 40,
  researcher: 30,
  public_viewer: 10,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function hasAnyRole(userRole: Role, roles: Role[]): boolean {
  return roles.includes(userRole);
}

export function isAdmin(role: Role): boolean {
  return hasRole(role, "governance_admin");
}

export function isPartner(role: Role): boolean {
  return role === "partner_admin" || role === "partner_user";
}

export const ROUTE_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard": ["super_admin", "foundation_admin", "governance_admin", "partner_admin", "partner_user"],
  "/partners": ["super_admin", "foundation_admin", "partner_admin"],
  "/projects": ["super_admin", "foundation_admin", "governance_admin", "partner_admin", "partner_user"],
  "/deployments": ["super_admin", "foundation_admin", "governance_admin", "partner_admin", "partner_user"],
  "/milestones": ["super_admin", "foundation_admin", "governance_admin", "partner_admin", "partner_user"],
  "/incentives": ["super_admin", "foundation_admin", "partner_admin"],
  "/standards": ["super_admin", "foundation_admin", "governance_admin", "certifier", "researcher"],
  "/certifications": ["super_admin", "foundation_admin", "governance_admin", "certifier"],
  "/governance": ["super_admin", "foundation_admin", "governance_admin"],
  "/proof-console": ["super_admin", "foundation_admin", "governance_admin"],
  "/reports": ["super_admin", "foundation_admin", "governance_admin", "partner_admin"],
  "/settings": ["super_admin", "foundation_admin"],
  "/admin": ["super_admin", "foundation_admin"],
};
