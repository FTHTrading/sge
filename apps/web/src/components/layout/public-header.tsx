"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap } from "lucide-react";
import { PUBLIC_NAV } from "@/lib/navigation";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[hsl(220,16%,4%)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            SGE <span className="text-white/50 font-normal">Foundation</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3.5 py-2 text-sm text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/apply"
            className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
          >
            Join Ecosystem
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-white/60 hover:text-white"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[hsl(220,16%,4%)] px-6 py-4">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm text-white/60 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-col gap-2">
            <Link href="/login" className="text-sm text-white/70">Sign In</Link>
            <Link
              href="/apply"
              className="inline-flex justify-center px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg"
            >
              Join Ecosystem
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
