import type { NavItem } from "@sge/types";

export const PUBLIC_NAV: NavItem[] = [
  { label: "Home", href: "/home" },
  { label: "Mission", href: "/mission" },
  { label: "Technology", href: "/technology" },
  { label: "Standards", href: "/standards-public" },
  { label: "Ecosystem", href: "/ecosystem" },
  { label: "Governance", href: "/governance-public" },
  { label: "Research", href: "/research" },
  { label: "Contact", href: "/contact" },
];

export const APP_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Partners", href: "/partners", icon: "Handshake", roles: ["super_admin", "foundation_admin", "partner_admin"] },
  { label: "Projects", href: "/projects", icon: "FolderKanban" },
  { label: "Deployments", href: "/deployments", icon: "Rocket" },
  { label: "Milestones", href: "/milestones", icon: "Target" },
  { label: "Incentives", href: "/incentives", icon: "TrendingUp", roles: ["super_admin", "foundation_admin", "partner_admin"] },
  { label: "Standards", href: "/standards", icon: "BookOpen" },
  { label: "Certifications", href: "/certifications", icon: "Award" },
  { label: "Governance", href: "/governance", icon: "Scale" },
  { label: "Proof Console", href: "/proof-console", icon: "ShieldCheck", roles: ["super_admin", "foundation_admin", "governance_admin"] },
  { label: "Reports", href: "/reports", icon: "FileBarChart" },
  { label: "Activate", href: "/activate", icon: "Zap" },
  { label: "Activation Status", href: "/activation-dashboard", icon: "ShieldCheck" },
  { label: "Claim SGE", href: "/claim-sge", icon: "Coins" },
  { label: "MetaMask Card", href: "/metamask-card", icon: "CreditCard" },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["super_admin", "foundation_admin"] },
];

export const ADMIN_NAV: NavItem[] = [
  { label: "Admin Home", href: "/admin", icon: "Shield", roles: ["super_admin", "foundation_admin"] },
  { label: "Local Wallet", href: "/admin/wallet", icon: "Key", roles: ["super_admin", "foundation_admin"] },
  { label: "Claims", href: "/admin/claims", icon: "Wallet", roles: ["super_admin", "foundation_admin"] },
  { label: "Contracts", href: "/admin/contracts", icon: "FileCode", roles: ["super_admin", "foundation_admin"] },
  { label: "Users", href: "/admin/users", icon: "Users", roles: ["super_admin", "foundation_admin"] },
  { label: "Organizations", href: "/admin/organizations", icon: "Building", roles: ["super_admin", "foundation_admin"] },
  { label: "SGE Config", href: "/admin/sge", icon: "Coins", roles: ["super_admin", "foundation_admin"] },
  { label: "MetaMask Card", href: "/admin/metamask-card", icon: "CreditCard", roles: ["super_admin", "foundation_admin"] },
];
