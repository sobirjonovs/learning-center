"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { btn } from "@/components/ui";
import { useTheme } from "./theme-provider";

export function ConfirmDialog({
  open,
  title = "Ishonchingiz komilmi?",
  message,
  confirmLabel = "Ha, o'chirish",
  cancelLabel = "Bekor qilish",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={ref}
        className={cn(
          "w-full max-w-md animate-pop rounded-2xl border p-6 shadow-xl",
          isLight
            ? "border-slate-200 bg-white shadow-2xl"
            : "border-white/15 bg-surface-raised backdrop-blur-xl"
        )}
      >
        <h3
          id="confirm-dialog-title"
          className={cn(
            "text-lg font-bold tracking-tight",
            isLight ? "text-slate-900" : "text-white"
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            "mt-3 text-sm leading-relaxed",
            isLight ? "text-slate-600" : "text-slate-300"
          )}
        >
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading} className={btn.secondary}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={danger ? btn.danger : btn.primary}
          >
            {loading ? "Kutilmoqda..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
