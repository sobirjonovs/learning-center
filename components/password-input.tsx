"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";

export function PasswordInput({
  className,
  id,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        className={cn(inputCls, "pr-10", className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 transition",
          "text-slate-400 hover:text-slate-200",
          "classic-canvas:text-slate-500 classic-canvas:hover:text-slate-800"
        )}
        aria-label={visible ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
