import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "gold" | "plum" | "amber" | "rose" | "violet" | "emerald" | "sky";

const TONES: Record<Tone, { chip: string; value: string }> = {
  gold: { chip: "bg-[#F9F2E4] text-[#B8893A] border border-[#EAE0D2]", value: "text-[#1F1815]" },
  plum: { chip: "bg-[#FBF2F4] text-[#7A1624] border border-[#FECDD3]", value: "text-[#1F1815]" },
  amber: { chip: "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]", value: "text-[#1F1815]" },
  rose: { chip: "bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3]", value: "text-[#9F1239]" },
  violet: { chip: "bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB]", value: "text-[#1F1815]" },
  emerald: { chip: "bg-[#ECFDF3] text-[#065F46] border border-[#A7F3D0]", value: "text-[#1F1815]" },
  sky: { chip: "bg-sky-50 text-sky-700 border border-sky-200", value: "text-[#1F1815]" },
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

/** Editorial KPI tile: eyebrow label, big serif figure, quiet hint. Link when `href` is given. */
export function StatCard({ label, value, hint, icon: Icon, tone = "gold", href, className }: StatCardProps) {
  const t = TONES[tone] || TONES.gold;
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow-mute">{label}</span>
        {Icon && (
          <span className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs", t.chip)}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className={cn("font-display font-semibold text-3xl mt-2 num leading-none", t.value)}>{value}</div>
      {hint && <span className="text-[11px] text-mute mt-2 block">{hint}</span>}
    </>
  );
  const cls = cn("surface p-4.5 block rounded-2xl border border-line bg-white shadow-2xs", href && "surface-interactive", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
