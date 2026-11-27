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
    <div className={cn("flex flex-col items-center text-center px-6 py-10 animate-in fade-in", className)}>
      <div className="relative w-14 h-14 rounded-full bg-gold-soft border border-line flex items-center justify-center">
        <span className="absolute inset-1.5 rounded-full border border-dashed border-gold/50" />
        <Icon className="w-5 h-5 text-gold-dark relative" />
      </div>
      <p className="section-title text-base mt-3">{title}</p>
      {hint && <p className="text-xs text-mute mt-1 max-w-xs leading-relaxed">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
