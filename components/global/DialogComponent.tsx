"use client";

import React, { useCallback, useEffect, useRef } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { Button } from "./ButtonComponent";

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // allow custom width (defaults to max-w-md)
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = "max-w-md",
}: DialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // focus first focusable
    setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        "button, input, textarea, select, a[href], [tabindex]:not([tabindex='-1'])",
      );
      el?.focus();
    }, 10);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={clsx(
          "relative w-full origin-top animate-fade-in rounded-xl border border-[var(--app-border)] bg-[linear-gradient(135deg,rgba(17,23,31,0.95)_0%,rgba(28,37,48,0.9)_60%,rgba(36,46,59,0.85)_100%)] backdrop-blur-2xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.65),0_6px_18px_-6px_rgba(0,0,0,0.55)] px-5 pt-5 pb-4 flex flex-col gap-4",
          widthClass,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1 pr-2">
            {title && (
              <h2 className="text-base font-semibold tracking-wide text-[var(--app-foreground)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-[var(--app-foreground-muted)] leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            shadow={false}
            onClick={onClose}
            aria-label="Close dialog"
            className="px-2 py-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        {children && <div className="flex flex-col gap-3">{children}</div>}
        {footer && <div className="pt-2 flex items-center gap-2">{footer}</div>}
      </div>
    </div>
  );
}
