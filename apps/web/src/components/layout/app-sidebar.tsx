"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, ChevronLeft, ChevronRight,
  LayoutDashboard, Handshake, FolderKanban, Rocket, Target,
  TrendingUp, BookOpen, Award, Scale, ShieldCheck,
  FileBarChart, Settings, Shield, FileCode, Users, Building,
  Coins, Wallet, CreditCard, Key,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { APP_NAV, ADMIN_NAV } from "@/lib/navigation";
import type { NavItem, Role } from "@sge/types";

function filterNavByRole(items: NavItem[], role?: Role): NavItem[] {
  if (!role) return items.filter((item) => !item.roles || item.roles.length === 0);
  return items.filter((item) => !item.roles || item.roles.length === 0 || item.roles.includes(role));
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Handshake, FolderKanban, Rocket, Target,
  TrendingUp, BookOpen, Award, Scale, ShieldCheck,
  FileBarChart, Settings, Shield, FileCode, Users, Building,
  Coins, Wallet, CreditCard, Key,
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon ? ICON_MAP[item.icon] : undefined;

  return (
    <Link
      href={item.href}
      className={`
        group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
        ${isActive
          ? "bg-emerald-600/10 text-emerald-400 ring-1 ring-emerald-500/20"
          : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
        }
        ${collapsed ? "justify-center px-2.5" : ""}
      `}
      title={collapsed ? item.label : undefined}
    >
      {Icon && (
        <Icon
          className={`h-[18px] w-[18px] flex-shrink-0 ${
            isActive ? "text-emerald-400" : "text-white/30 group-hover:text-white/50"
          }`}
        />
      )}
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-emerald-600/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavSection({
  label,
  items,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <h3 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">
          {label}
        </h3>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

export function AppSidebar({ role }: { role?: Role }) {
  const [collapsed, setCollapsed] = useState(false);

  const allAppNav = filterNavByRole(APP_NAV, role);
  const allAdminNav = filterNavByRole(ADMIN_NAV, role);

  const mainNav = allAppNav.filter((i) =>
    ["/dashboard", "/partners", "/projects"].includes(i.href)
  );
  const operationsNav = allAppNav.filter((i) =>
    ["/deployments", "/milestones", "/incentives", "/standards"].includes(i.href)
  );
  const governanceNav = allAppNav.filter((i) =>
    ["/certifications", "/governance", "/proof-console"].includes(i.href)
  );
  const toolsNav = allAppNav.filter((i) =>
    ["/reports", "/claim-sge", "/metamask-card", "/operator-testing", "/settings"].includes(i.href)
  );

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.06]
        bg-[hsl(220,16%,4%)] transition-[width] duration-200
        ${collapsed ? "w-[68px]" : "w-[260px]"}
      `}
    >
      {/* Brand */}
      <div className="flex h-[60px] items-center justify-between border-b border-white/[0.06] px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white leading-none">SGE</span>
              <span className="text-[10px] text-white/30 leading-tight">Alignment OS</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 text-white/30 hover:bg-white/[0.04] hover:text-white/60 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <NavSection label="Overview" items={mainNav} collapsed={collapsed} />
        <NavSection label="Operations" items={operationsNav} collapsed={collapsed} />
        <NavSection label="Governance" items={governanceNav} collapsed={collapsed} />
        <NavSection label="Tools" items={toolsNav} collapsed={collapsed} />

        {allAdminNav.length > 0 && (
          <>
            <div className="border-t border-white/[0.06]" />
            <NavSection label="Admin" items={allAdminNav} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] p-3">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-white/30">v1.0.0 — Production</span>
          </div>
        )}
      </div>
    </aside>
  );
}
