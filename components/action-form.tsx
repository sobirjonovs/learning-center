"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent, type ReactNode } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { isActionResult } from "@/lib/action-result";
import { MSGS } from "@/lib/toast-messages";
import { useToast } from "@/components/toast-provider";

type ServerAction = (formData: FormData) => Promise<unknown>;

export function ActionForm({
  action,
  className,
  children,
  successMessage = MSGS.saved,
  onSuccess,
}: {
  action: ServerAction;
  className?: string;
  children: ReactNode;
  successMessage?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
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
        onSuccess?.();
      } catch (err) {
        if (isRedirectError(err)) return;
        toast({ type: "error", message: MSGS.failed });
      }
    });
  };

  return (
    <form action={undefined} onSubmit={handleSubmit} className={className} data-pending={pending || undefined}>
      {children}
    </form>
  );
}
