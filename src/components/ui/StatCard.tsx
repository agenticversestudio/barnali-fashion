import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "gold" | "plum" | "amber" | "rose" | "violet" | "emerald" | "sky" | "coral";

const TONES: Record<Tone, { chip: string; value: string; hint: string }> = {
  gold: { chip: "bg-[#FEF3C7] text-[#D97706]", value: "text-[#18141E]", hint: "text-[#D97706]" },
  plum: { chip: "bg-[#FFE4E6] text-[#E11D48]", value: "text-[#18141E]", hint: "text-[#E11D48]" },
  amber: { chip: "bg-[#FEF3C7] text-[#D97706]", value: "text-[#18141E]", hint: "text-[#D97706]" },
  rose: { chip: "bg-[#FFEDD5] text-[#EA580C]", value: "text-[#EA580C]", hint: "text-[#EA580C]" },
  violet: { chip: "bg-[#E0E7FF] text-[#4F46E5]", value: "text-[#18141E]", hint: "text-[#4F46E5]" },
  emerald: { chip: "bg-[#D1FAE5] text-[#059669]", value: "text-[#18141E]", hint: "text-[#059669]" },
  sky: { chip: "bg-[#E0F2FE] text-[#0284C7]", value: "text-[#18141E]", hint: "text-[#0284C7]" },
  coral: { chip: "bg-[#FFEDD5] text-[#EA580C]", value: "text-[#EA580C]", hint: "text-[#EA580C]" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  href?: string;
  className?: string;
}

/** Revive-AI-inspired luminous KPI tile: 40px pastel-tinted icon badge, crisp 32px tabular number, colored trend hint. */
export function StatCard({ label, value, hint, icon: Icon, tone = "gold", href, className }: StatCardProps) {
  const t = TONES[tone] || TONES.gold;
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-[#5B5566] leading-tight">{label}</span>
        {Icon && (
          <span className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0", t.chip)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
        )}
      </div>
      <div className={cn("text-2xl sm:text-[32px] font-bold tracking-[-0.03em] mt-2.5 num leading-none whitespace-nowrap", t.value)}>{value}</div>
      {hint && <span className={cn("text-[11px] font-medium mt-2 block leading-snug", t.hint)}>{hint}</span>}
    </>
  );
  const cls = cn(
    "surface p-3.5 sm:p-5 block rounded-[20px] h-full",
    href && "surface-interactive",
    className
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
