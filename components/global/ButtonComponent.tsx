"use client";

import { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: ReactNode;
  shadow?: boolean; // enable/disable base shadow (default: true)
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  type = "button",
  icon,
  shadow = true,
}: ButtonProps) {
  // Base adopts the glassy, gradient, subtle border & shadow language used in BottomNav
  const baseClasses = [
    "group relative inline-flex items-center justify-center font-medium",
    "overflow-hidden select-none",
    "rounded-lg border border-[var(--app-border)]",
    "bg-[linear-gradient(135deg,rgba(17,23,31,0.9)_0%,rgba(28,37,48,0.85)_60%,rgba(36,46,59,0.8)_100%)]",
    "backdrop-blur-xl",
    "transition-all duration-300",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-background)]",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.97]",
  ].join(" ");
  const shadowClasses = shadow
    ? "shadow-[0_10px_32px_-6px_rgba(0,0,0,0.55),0_4px_12px_-2px_rgba(0,0,0,0.45)]"
    : "shadow-none hover:shadow-none";

  // Variants tweak accent usage & hover states while preserving shared glass base
  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: [
      "text-[var(--app-foreground)]",
      // Accent glow on hover similar to .bottom-nav-item-active .active-bg
      "hover:border-[color:rgba(99,102,241,0.35)]",
      "hover:shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_8px_24px_-6px_rgba(0,0,0,0.55)]",
      "focus-visible:border-[color:rgba(99,102,241,0.4)]",
    ].join(" "),
    secondary: [
      "text-[var(--app-foreground-muted)]",
      "hover:text-[var(--app-foreground)]",
      "hover:border-[color:rgba(148,163,184,0.35)]",
      "hover:shadow-[0_0_0_1px_rgba(148,163,184,0.18),0_6px_20px_-6px_rgba(0,0,0,0.55)]",
    ].join(" "),
    outline: [
      "border-[color:rgba(99,102,241,0.4)]",
      "text-[var(--app-accent)]",
      "hover:text-[var(--app-foreground)]",
      "hover:border-[color:rgba(99,102,241,0.55)]",
      "hover:shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_6px_20px_-6px_rgba(0,0,0,0.55)]",
    ].join(" "),
    ghost: [
      "text-[var(--app-foreground-muted)]",
      "hover:text-[var(--app-foreground)]",
      "hover:bg-[rgba(99,102,241,0.08)]",
      "hover:shadow-[0_0_0_1px_rgba(99,102,241,0.15)]",
    ].join(" "),
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 rounded-md",
    md: "text-sm px-4 py-2 rounded-lg",
    lg: "text-base px-6 py-3 rounded-lg",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${shadowClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_15%,rgba(99,102,241,0.35),rgba(59,130,246,0.05))]"
        aria-hidden
      />
      {icon && <span className="flex items-center mr-2 shrink-0">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
