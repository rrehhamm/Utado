import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "outline" | "ghost" | "accent" | "outline-accent";
};

const VARIANTS: Record<string, string> = {
  gold: "bg-accent text-cassis hover:bg-accent-hover",
  outline: "border border-ink/20 text-ink hover:border-ink/40",
  ghost: "text-ink hover:bg-ink/5",
  // Landing page brand variants — pinned to the light-mode palette since the landing page's
  // sections have a fixed editorial mood and aren't theme-reactive like the rest of the app.
  accent: "bg-topaze text-cassis hover:bg-topaze-dark",
  "outline-accent": "border border-cassis/20 text-cassis hover:border-cassis/40",
};

export function Button({ variant = "gold", className, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-colors ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
