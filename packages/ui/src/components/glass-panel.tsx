import * as React from "react";
import { cn } from "../lib/utils";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export function GlassPanel({ className, hover, glow, children, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel",
        hover && "hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300",
        glow && "glow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
