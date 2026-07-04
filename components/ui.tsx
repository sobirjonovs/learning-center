// Umumiy UI primitivlar — barcha modullar shulardan foydalanadi.
import Link from "next/link";
import { cn, initials } from "@/lib/utils";

// ---------------- Card ----------------
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  action,
}: {
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-2", className)}>
      <h3 className="text-sm font-semibold text-slate-700">{children}</h3>
      {action}
    </div>
  );
}

// ---------------- Stat card ----------------
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "indigo",
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  hint?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet";
}) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl", tones[tone])}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
    </Card>
  );
}

// ---------------- Badge ----------------
export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className ?? "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge className={active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}>
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Faol" : "Faol emas"}
    </Badge>
  );
}

// ---------------- Button styles ----------------
export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 active:scale-[0.98]",
  small:
    "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50",
};

// ---------------- Form elements ----------------
export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-50";

export function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
      {required && <span className="text-rose-500"> *</span>}
    </label>
  );
}

export function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

// ---------------- Table ----------------
export function Table({
  head,
  children,
  className,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
            {head}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

// ---------------- Avatar ----------------
export function Avatar({
  name,
  image,
  size = "md",
  className,
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
    xl: "h-24 w-24 text-3xl",
  };
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-600",
        sizes[size],
        className
      )}
    >
      {initials(name)}
    </div>
  );
}

// ---------------- Progress bar ----------------
export function ProgressBar({
  value, // 0..100
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className={cn("h-full rounded-full bg-indigo-500 transition-all", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ---------------- Page header ----------------
export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-indigo-600">
            ← Orqaga
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon = "📭",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-xs text-slate-400">{hint}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------------- Tabs (link-based) ----------------
export function LinkTabs({
  tabs,
  current,
}: {
  tabs: Array<{ href: string; label: string; key: string }>;
  current: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-medium transition",
            current === t.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
