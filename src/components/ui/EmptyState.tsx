import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

/** Soft, boutique empty state: a hanger-ring medallion, serif title, one line of guidance. */
export function EmptyState({ title, hint, icon, action, className }: EmptyStateProps) {
  const Icon = icon ?? Sparkles;
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-12 animate-in fade-in", className)}>
      <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFE4E6] via-[#FEF3C7] to-[#E0E7FF] border border-white flex items-center justify-center shadow-sm">
        <Icon className="w-6 h-6 text-[#BE123C] relative" />
      </div>
      <p className="section-title text-base text-[#18141E] mt-4 font-semibold">{title}</p>
      {hint && <p className="text-xs text-[#5B5566] mt-1.5 max-w-sm leading-relaxed">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
