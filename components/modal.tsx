"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export function Modal({
  trigger,
  title,
  children,
  wide,
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const overlay =
    open && mounted ? (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md">
        <div
          ref={ref}
          className={cn(
            "my-8 w-full cursor-default animate-pop rounded-2xl border p-6 shadow-xl",
            wide ? "max-w-3xl" : "max-w-lg",
            isLight
              ? "border-slate-200 bg-white shadow-2xl"
              : "border-white/15 bg-surface-raised backdrop-blur-xl"
          )}
        >
          <div className="mb-5 flex items-center justify-between">
            <h3
              className={cn(
                "text-lg font-bold tracking-tight",
                isLight ? "text-slate-900" : "text-white"
              )}
            >
              {title}
            </h3>
            <button
              onClick={() => setOpen(false)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                isLight
                  ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              )}
              aria-label="Yopish"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    ) : null;

  return (
    <>
      <span className="cursor-pointer" onClick={() => setOpen(true)}>
        {trigger}
      </span>
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
