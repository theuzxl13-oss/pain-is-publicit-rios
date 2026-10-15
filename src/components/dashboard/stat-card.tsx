import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning";
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneClass)}>
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
