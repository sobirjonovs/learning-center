"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Oddiy modal: trigger bosilganda ochiladi, fon yoki ✕ bosilganda yopiladi.
 * Ichidagi forma submit bo'lganda avtomatik yopiladi (server action tugashini
 * kutib, sahifa revalidate bo'lgach yangi ma'lumot ko'rinadi).
 */
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div
            ref={ref}
            className={`my-8 w-full ${wide ? "max-w-3xl" : "max-w-lg"} animate-pop rounded-2xl bg-white p-6 shadow-2xl`}
            onSubmit={() => {
              // server action yakunlanishiga ozgina vaqt berib yopamiz
              setTimeout(() => setOpen(false), 400);
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
