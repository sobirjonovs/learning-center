"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: string; exact?: boolean };

export function Sidebar({
  items,
  brand,
  brandIcon,
  accent = "text-indigo-600 bg-indigo-50",
}: {
  items: NavItem[];
  brand: string;
  brandIcon: string;
  accent?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active ? accent : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobil sarlavha */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span className="text-xl">{brandIcon}</span> {brand}
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          aria-label="Menyu"
        >
          ☰
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white">
            {brandIcon}
          </span>
          <div>
            <div className="text-sm font-bold text-slate-900">EduCenter</div>
            <div className="text-xs text-slate-400">{brand}</div>
          </div>
        </div>
        {nav}
      </aside>
    </>
  );
}
