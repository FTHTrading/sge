"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  className?: string;
}

export function KpiCard({ label, value, change, changeLabel, icon, trend, className }: KpiCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white/40";

  return (
    <div
      className={cn(
        "glass-panel p-6 flex flex-col gap-3 group hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          {label}
        </span>
        {icon && (
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            {icon}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold tracking-tight text-white">
        {value}
      </div>
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendIcon className={cn("h-3.5 w-3.5", trendColor)} />
          {change !== undefined && (
            <span className={trendColor}>
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          )}
          {changeLabel && <span className="text-white/30">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
