import * as React from "react";
import { cn } from "../lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="h-12 w-12 rounded-xl bg-white/[0.04] flex items-center justify-center text-white/20 mb-4">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-medium text-white/70">{title}</h3>
      {description && <p className="mt-1 text-sm text-white/40 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
