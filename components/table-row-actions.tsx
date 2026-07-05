"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import type { ActionResult } from "@/lib/action-result";
import { btn } from "@/components/ui";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

const UNDO_MS = 3000;

type ActionLink = { href: string; label: string };

type ActionForm = {
  action: (formData: FormData) => Promise<ActionResult | void> | ActionResult | void;
  id: string;
  label: string;
  confirm?: string;
  danger?: boolean;
  /** true bo'lsa: tasdiqlashdan keyin 3 soniya kutib o'chiradi, bekor qilish mumkin */
  deferredDelete?: boolean;
};

function ActionMenu({
  forms,
  anchorRef,
  open,
  onClose,
  onPick,
}: {
  forms: ActionForm[];
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  onPick: (form: ActionForm) => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      if (menuRef.current?.contains(target)) return;
      onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener("click", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 min-w-[11rem] -translate-x-full overflow-hidden rounded-xl border py-1 shadow-lg",
        "border-white/15 bg-surface-raised backdrop-blur-xl",
        "classic-canvas:border-slate-200 classic-canvas:bg-white classic-canvas:shadow-md"
      )}
      style={{ top: pos.top, left: pos.left }}
    >
      {forms.map((f) => (
        <button
          key={f.id + f.label}
          type="button"
          onClick={() => {
            onClose();
            onPick(f);
          }}
          className={cn(
            "block w-full px-3 py-2 text-left text-sm transition",
            f.danger
              ? "text-rose-400 hover:bg-rose-500/10 classic-canvas:text-rose-600 classic-canvas:hover:bg-rose-50"
              : "text-slate-300 hover:bg-white/10 classic-canvas:text-slate-700 classic-canvas:hover:bg-slate-50"
          )}
        >
          {f.label}
        </button>
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
  const [pending, setPending] = useState<ActionForm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const runAction = useCallback(
    (form: ActionForm) => {
      startTransition(async () => {
        const fd = new FormData();
        fd.set("id", form.id);
        try {
          const result = await form.action(fd);
          if (!result || typeof result !== "object" || !("ok" in result)) {
            router.refresh();
            return;
          }
          if (result.ok) {
            toast({ type: "success", message: result.message });
          } else {
            toast({ type: "error", message: result.error });
          }
          router.refresh();
        } catch {
          toast({ type: "error", message: "Amal bajarilmadi. Qayta urinib ko'ring." });
        }
      });
    },
    [router, toast]
  );

  const scheduleDelete = useCallback(
    (form: ActionForm) => {
      const detail = form.confirm ? form.confirm.split(".")[0] : "Yozuv";
      toast({
        type: "info",
        message: `${detail}. 3 soniyadan so'ng o'chiriladi.`,
        duration: UNDO_MS + 500,
        action: {
          label: "Bekor qilish",
          onClick: () => {
            if (undoTimer.current) {
              clearTimeout(undoTimer.current);
              undoTimer.current = null;
            }
            toast({ type: "info", message: "O'chirish bekor qilindi" });
          },
        },
      });

      undoTimer.current = setTimeout(() => {
        undoTimer.current = null;
        runAction(form);
      }, UNDO_MS);
    },
    [runAction, toast]
  );

  const handlePick = (form: ActionForm) => {
    if (form.confirm) {
      setPending(form);
      setConfirmOpen(true);
      return;
    }
    runAction(form);
  };

  const handleConfirm = () => {
    if (!pending) return;
    setConfirmOpen(false);
    if (pending.deferredDelete || pending.danger) {
      scheduleDelete(pending);
    } else {
      runAction(pending);
    }
    setPending(null);
  };

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
    <>
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
        <ActionMenu
          forms={forms}
          anchorRef={btnRef}
          open={open}
          onClose={() => setOpen(false)}
          onPick={handlePick}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Haqiqatan ham o'chirmoqchimisiz?"
        message={pending?.confirm ?? "Bu amalni qaytarib bo'lmaydi."}
        confirmLabel="Ha, davom etish"
        danger={pending?.danger}
        loading={isPending}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setPending(null);
        }}
      />
    </>
  );
}
