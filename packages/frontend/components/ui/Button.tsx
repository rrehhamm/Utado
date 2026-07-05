import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "outline" | "ghost";
};

const VARIANTS: Record<string, string> = {
  gold: "bg-gold text-charcoal hover:bg-gold-dark",
  outline: "border border-charcoal/20 text-charcoal hover:border-charcoal/40",
  ghost: "text-charcoal hover:bg-charcoal/5",
};

export function Button({ variant = "gold", className, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold transition-colors ${VARIANTS[variant]} ${className ?? ""}`}
      {...props}
    />
  );
}
