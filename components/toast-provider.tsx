"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

type ToastType = "success" | "error" | "info";

type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
  action?: { label: string; onClick: () => void };
  duration: number;
};

type ToastInput = {
  type?: ToastType;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  useEffect(() => {
    setMounted(true);
    return () => {
      for (const t of timers.current.values()) clearTimeout(t);
      timers.current.clear();
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const toast = useCallback(
    ({ type = "info", message, action, duration = action ? 5000 : 4000 }: ToastInput) => {
      const id = `toast-${++toastCounter}`;
      setItems((prev) => [...prev, { id, type, message, action, duration }]);

      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const styles: Record<ToastType, string> = {
    success: isLight
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
    error: isLight
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-rose-500/30 bg-rose-500/15 text-rose-200",
    info: isLight
      ? "border-blue-200 bg-blue-50 text-blue-900"
      : "border-blue-500/30 bg-blue-500/15 text-blue-200",
  };

  const portal =
    mounted && items.length > 0 ? (
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 sm:bottom-6 sm:right-6"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto animate-slide-up rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md",
              styles[item.type]
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex-1 leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="shrink-0 opacity-60 transition hover:opacity-100"
                aria-label="Yopish"
              >
                ×
              </button>
            </div>
            {item.action && (
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  dismiss(item.id);
                }}
                className={cn(
                  "mt-2 text-xs font-bold uppercase tracking-wide underline-offset-2 hover:underline",
                  isLight ? "text-slate-800" : "text-white"
                )}
              >
                {item.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    ) : null;

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {portal ? createPortal(portal, document.body) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return ctx;
}
