import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return <As className={cn("glass-card p-4 sm:p-5", className)}>{children}</As>;
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground", className)}>
      {children}
    </h2>
  );
}
