import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "gold" | "plum" | "amber" | "rose" | "violet" | "emerald" | "sky";

const TONES: Record<Tone, { chip: string; value: string }> = {
  gold: { chip: "bg-gold-soft text-gold border border-line", value: "text-ink" },
  plum: { chip: "bg-plum-soft text-plum border border-rose-200", value: "text-ink" },
  amber: { chip: "bg-amber-100 text-amber-800 border border-amber-200", value: "text-ink" },
  rose: { chip: "bg-rose-50 text-rose-800 border border-rose-200", value: "text-rose-800" },
  violet: { chip: "bg-gray-100 text-gray-700 border border-gray-200", value: "text-ink" },
  emerald: { chip: "bg-emerald-50 text-emerald-800 border border-emerald-200", value: "text-ink" },
  sky: { chip: "bg-sky-50 text-sky-700 border border-sky-200", value: "text-ink" },
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
