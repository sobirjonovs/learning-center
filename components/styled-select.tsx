"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

export type StyledSelectOption = {
  value: string;
  label: string;
  dot?: string;
};

export function StyledSelect({
  name,
  options,
  defaultValue,
  required,
  className,
  placeholder,
}: {
  name: string;
  options: StyledSelectOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(defaultValue ?? "");
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { resolved } = useTheme();
  const isLight = resolved === "light";

  const selected = options.find((o) => o.value === value);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuHeight = Math.min(options.length * 46 + 16, 280);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 60,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 6 }
        : { top: rect.bottom + 6 }),
    });
  }, [options.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !wrapRef.current?.contains(target) &&
        !(target as Element).closest?.("[data-styled-select-menu]")
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menu =
    open && mounted ? (
      <div
        data-styled-select-menu
        style={menuStyle}
        className={cn(
          "flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-xl border p-1.5 shadow-2xl animate-pop",
          isLight
            ? "border-slate-200/80 bg-white"
            : "border-white/12 bg-surface-raised/95 backdrop-blur-xl"
        )}
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setValue(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition duration-150",
                isSelected
                  ? isLight
                    ? "bg-blue-50 font-medium text-blue-700 shadow-sm"
                    : "bg-blue-500/15 font-medium text-blue-300 ring-1 ring-blue-500/20"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-50"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
              )}
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-full ring-2 ring-white/10",
                  opt.dot ?? (isLight ? "bg-slate-300" : "bg-slate-500")
                )}
              />
              <span className="min-w-0 flex-1 leading-snug">{opt.label}</span>
              <Check
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "text-blue-400" : "opacity-0",
                  isLight && isSelected && "text-blue-600"
                )}
                strokeWidth={2.5}
              />
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <input type="hidden" name={name} value={value} required={required && !value} />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-sm shadow-sm transition duration-150",
          isLight
            ? "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
            : "border-white/12 bg-white/[0.06] text-ink shadow-black/10 hover:border-white/20 hover:bg-white/[0.08]",
          open &&
            (isLight
              ? "border-brand-500 shadow-[0_0_0_4px_rgb(59_130_246/0.12)]"
              : "border-brand-500/70 bg-white/[0.09] shadow-[0_0_0_4px_rgb(59_130_246/0.18)]")
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {selected?.dot ? (
            <span className={cn("size-2.5 shrink-0 rounded-full", selected.dot)} />
          ) : null}
          <span className={cn("truncate", !selected && "text-slate-500")}>
            {selected?.label ?? placeholder ?? "Tanlang..."}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 opacity-60 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
