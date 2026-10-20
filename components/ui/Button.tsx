"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:opacity-90 disabled:opacity-40",
  secondary:
    "border border-line text-ink hover:bg-surface-2 disabled:opacity-40",
  ghost: "text-ink hover:bg-surface-2 disabled:opacity-40",
  danger:
    "border border-line text-danger hover:bg-surface-2 disabled:opacity-40",
};

const SIZE_CLASSES: Record<Size, string> = {
  md: "px-5 py-3 text-sm",
  sm: "px-3.5 py-2 text-[13px]",
};

/// Same styling as Button, for links that look like buttons.
export function buttonClasses(
  variant: Variant = "primary",
  size: Size = "md",
): string {
  return `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[opacity,background-color] disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`;
}

/// Shared button. Shape (radius) and color come from the look's tokens,
/// so the same component reads as a navy tab in Tailor's navy and a
/// plain black block in Colour story.
export function Button({
  variant = "primary",
  size = "md",
  icon,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${buttonClasses(variant, size)} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
