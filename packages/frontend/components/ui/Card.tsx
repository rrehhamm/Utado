import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl2 bg-cream shadow-soft ${className ?? ""}`}
      {...props}
    />
  );
}
