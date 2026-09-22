"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "filled" | "outlined" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  filled:
    "bg-accent text-white hover:bg-accent-strong disabled:bg-accent/40",
  outlined:
    "border border-outline text-foreground hover:bg-outline/30 disabled:opacity-40",
  text: "text-accent hover:bg-accent/10 disabled:opacity-40",
};

/// Small shared button component standing in for Material's
/// FilledButton/OutlinedButton/TextButton, used throughout the ported
/// screens.
export function Button({
  variant = "filled",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
