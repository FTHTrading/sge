"use client";

import { AppSidebar } from "./app-sidebar";
import { Bell, Search, LogOut, User, Settings, Menu } from "lucide-react";
import { useState } from "react";

function AppTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-white/[0.06] bg-[hsl(220,16%,5%)]/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-3">
        <button className="lg:hidden rounded-md p-2 text-white/40 hover:bg-white/[0.04]">
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25" />
          <input
            type="text"
            placeholder="Search partners, projects, standards..."
            className="h-9 w-[320px] rounded-lg border border-white/[0.06] bg-white/[0.02] pl-9 pr-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative rounded-lg p-2 text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        <div className="ml-2 flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
          <div className="h-7 w-7 rounded-full bg-emerald-600/20 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white/80 leading-none">Admin User</p>
            <p className="text-[10px] text-white/30 mt-0.5">super_admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[hsl(220,16%,5%)]">
      <AppSidebar />
      <div className="flex flex-1 flex-col pl-[260px]">
        <AppTopbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
