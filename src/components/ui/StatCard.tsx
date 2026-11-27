import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "plum" | "amber" | "rose" | "violet" | "emerald" | "sky";

const TONES: Record<Tone, { chip: string; value: string }> = {
  plum: { chip: "bg-plum/10 text-plum", value: "text-ink" },
  amber: { chip: "bg-amber-50 text-amber-700", value: "text-ink" },
  rose: { chip: "bg-rose-50 text-rose-700", value: "text-rose-800" },
  violet: { chip: "bg-violet-50 text-violet-700", value: "text-ink" },
  emerald: { chip: "bg-emerald-50 text-emerald-700", value: "text-ink" },
  sky: { chip: "bg-sky-50 text-sky-700", value: "text-ink" },
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
export function StatCard({ label, value, hint, icon: Icon, tone = "plum", href, className }: StatCardProps) {
  const t = TONES[tone];
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow-mute">{label}</span>
        {Icon && (
          <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", t.chip)}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className={cn("font-display font-semibold text-3xl mt-2 num leading-none", t.value)}>{value}</div>
      {hint && <span className="text-[11px] text-mute mt-1.5 block">{hint}</span>}
    </>
  );
  const cls = cn("surface p-4 block", href && "surface-interactive", className);
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
