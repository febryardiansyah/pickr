"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

// Shares the same glass + gradient language used in Button & BottomNav
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, className = "", fullWidth = true, ...rest },
    ref
  ) => {
    const base = [
      "relative w-full",
      "rounded-lg border",
      "border-[var(--app-border)]",
      "bg-[linear-gradient(135deg,rgba(17,23,31,0.85)_0%,rgba(28,37,48,0.75)_60%,rgba(36,46,59,0.7)_100%)]",
      "backdrop-blur-xl",
      "px-4 py-2.5",
      "text-sm text-[var(--app-foreground)] placeholder:text-[var(--app-foreground-muted)]",
      "shadow-[0_4px_18px_-4px_rgba(0,0,0,0.55),0_2px_8px_-2px_rgba(0,0,0,0.45)]",
      "focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 focus:ring-offset-[var(--app-background)]",
      "transition-all duration-300",
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ].join(" ");

    const errorClasses = error
      ? "border-red-500 focus:ring-red-500 focus:ring-offset-[var(--app-background)]"
      : "hover:border-[color:rgba(99,102,241,0.4)]";

    return (
      <div className={`${fullWidth ? "w-full" : ""} flex flex-col gap-1`}>
        {label && (
          <label className="text-xs font-medium tracking-wide text-[var(--app-foreground-muted)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
            className={`${base} ${errorClasses} ${className}`}
          {...rest}
        />
        {(helperText || error) && (
          <p
            className={`text-[10px] mt-0.5 font-medium tracking-wide ${error ? "text-red-400" : "text-[var(--app-foreground-muted)]"}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
