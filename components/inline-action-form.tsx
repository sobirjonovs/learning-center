"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { cn } from "@/lib/utils";

type ServerAction = (formData: FormData) => Promise<unknown>;

type HiddenField = Record<string, string>;

export function InlineActionForm({
  action,
  hidden,
  confirmMessage,
  className,
  children,
  successMessage = MSGS.saved,
}: {
  action: ServerAction;
  hidden?: HiddenField;
  confirmMessage?: string;
  className?: string;
  children: ReactNode;
  successMessage?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = useCallback(() => {
    const fd = new FormData();
    if (hidden) {
      for (const [k, v] of Object.entries(hidden)) fd.set(k, v);
    }
    startTransition(async () => {
      try {
        const result = await action(fd);
        if (isActionResult(result)) {
          if (result.ok) {
            toast({ type: "success", message: result.message });
          } else {
            toast({ type: "error", message: result.error });
            return;
          }
        } else {
          toast({ type: "success", message: successMessage });
        }
        router.refresh();
      } catch (err) {
        if (isRedirectError(err)) return;
        toast({ type: "error", message: MSGS.failed });
      }
    });
  }, [action, hidden, router, successMessage, toast]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (confirmMessage) {
      setConfirmOpen(true);
      return;
    }
    run();
  };

  return (
    <>
      <div className={cn("inline-flex", className)} onClick={handleClick}>
        {children}
      </div>
      {confirmMessage && (
        <ConfirmDialog
          open={confirmOpen}
          title="Ishonchingiz komilmi?"
          message={confirmMessage}
          confirmLabel="Ha, davom etish"
          danger
          loading={pending}
          onConfirm={() => {
            setConfirmOpen(false);
            run();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
