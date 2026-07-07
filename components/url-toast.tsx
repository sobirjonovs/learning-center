"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";

function UrlToastInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const lastKey = useRef("");

  useEffect(() => {
    const success = searchParams.get("toast");
    const error = searchParams.get("toastError");
    if (!success && !error) return;

    const key = `${success ?? ""}|${error ?? ""}`;
    if (lastKey.current === key) return;
    lastKey.current = key;

    if (success) toast({ type: "success", message: success });
    if (error) toast({ type: "error", message: error });

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    params.delete("toastError");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, toast]);

  return null;
}

/** URL ?toast= va ?toastError= parametrlaridan bildirishnoma ko'rsatadi. */
export function UrlToast() {
  return (
    <Suspense fallback={null}>
      <UrlToastInner />
    </Suspense>
  );
}
