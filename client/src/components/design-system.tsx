import * as React from "react";
import { cn } from "@/lib/utils";

export function AppContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-shell", className)} {...props} />;
}

export function PremiumCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-card", className)} {...props} />;
}

export function SectionCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-card p-6 sm:p-8", className)} {...props} />;
}

export function StatusBadge({
  tone = "idle",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "idle" | "preparing" | "ready" | "active";
}) {
  const toneClass =
    tone === "preparing"
      ? "ds-status-preparing"
      : tone === "ready"
        ? "ds-status-ready"
        : tone === "active"
          ? "bg-primary/15 text-primary border border-primary/40"
          : "ds-status-idle";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        toneClass,
        className,
      )}
      {...props}
    />
  );
}
