import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl2 bg-surface-elevated shadow-soft dark:border dark:border-ink-muted/15 dark:shadow-none ${className ?? ""}`}
      {...props}
    />
  );
}
