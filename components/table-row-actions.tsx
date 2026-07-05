"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { btn } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { cn } from "@/lib/utils";

type ActionLink = { href: string; label: string };

type ActionForm = {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  label: string;
  confirm?: string;
  danger?: boolean;
};

function ActionMenu({
  forms,
  anchorRef,
  open,
  onClose,
}: {
  forms: ActionForm[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.right });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed z-50 min-w-[11rem] -translate-x-full overflow-hidden rounded-xl border py-1 shadow-lg",
        "border-white/15 bg-surface-raised backdrop-blur-xl",
        "classic-canvas:border-slate-200 classic-canvas:bg-white classic-canvas:shadow-md"
      )}
      style={{ top: pos.top, left: pos.left }}
    >
      {forms.map((f) => (
        <form key={f.id + f.label} action={f.action}>
          <input type="hidden" name="id" value={f.id} />
          {f.confirm ? (
            <ConfirmButton
              message={f.confirm}
              className={cn(
                "block w-full px-3 py-2 text-left text-sm transition",
                f.danger
                  ? "text-rose-400 hover:bg-rose-500/10 classic-canvas:text-rose-600 classic-canvas:hover:bg-rose-50"
                  : "text-slate-300 hover:bg-white/10 classic-canvas:text-slate-700 classic-canvas:hover:bg-slate-50"
              )}
            >
              {f.label}
            </ConfirmButton>
          ) : (
            <button
              type="submit"
              className="block w-full px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10 classic-canvas:text-slate-700 classic-canvas:hover:bg-slate-50"
            >
              {f.label}
            </button>
          )}
        </form>
      ))}
    </div>,
    document.body
  );
}

export function TableRowActions({
  links,
  forms = [],
}: {
  links: ActionLink[];
  forms?: ActionForm[];
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  if (forms.length === 0) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        {links.map((l) => (
          <Link key={l.href + l.label} href={l.href} className={btn.small}>
            {l.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {links.map((l) => (
        <Link key={l.href + l.label} href={l.href} className={btn.small}>
          {l.label}
        </Link>
      ))}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(btn.small, "px-2")}
        aria-label="Boshqa amallar"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
      </button>
      <ActionMenu forms={forms} anchorRef={btnRef} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
