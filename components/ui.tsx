// Umumiy UI primitivlar — dark glassmorphism (default) va klassik panel (classic-canvas).
import Link from "next/link";
import { Inbox } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { AppIcon, type LucideIcon } from "@/components/icon";
import { cn, initials } from "@/lib/utils";

// ---------------- Card ----------------
export function Card({
  className,
  children,
  hover,
  glow,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  glow?: "blue" | "orange" | "violet";
}) {
  return (
    <div
      className={cn(
        "glass-card",
        hover && "glass-card-hover",
        glow === "blue" && "glow-blue",
        glow === "orange" && "glow-orange",
        glow === "violet" && "glow-violet",
        className
      )}
    >
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
      <h3 className="text-sm font-semibold tracking-tight text-slate-200 classic-canvas:text-slate-800">{children}</h3>
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
  icon?: LucideIcon;
  hint?: string;
  tone?: "indigo" | "emerald" | "amber" | "rose" | "sky" | "violet" | "orange";
}) {
  const tones: Record<string, { bg: string; text: string; ring: string; lightBg: string }> = {
    indigo: {
      bg: "bg-blue-500/15",
      text: "text-blue-400 classic:text-blue-600",
      ring: "ring-blue-500/25 classic:ring-blue-200",
      lightBg: "classic:bg-blue-50",
    },
    emerald: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400 classic:text-emerald-600",
      ring: "ring-emerald-500/25 classic:ring-emerald-200",
      lightBg: "classic:bg-emerald-50",
    },
    amber: {
      bg: "bg-amber-500/15",
      text: "text-amber-400 classic:text-amber-600",
      ring: "ring-amber-500/25 classic:ring-amber-200",
      lightBg: "classic:bg-amber-50",
    },
    rose: {
      bg: "bg-rose-500/15",
      text: "text-rose-400 classic:text-rose-600",
      ring: "ring-rose-500/25 classic:ring-rose-200",
      lightBg: "classic:bg-rose-50",
    },
    sky: {
      bg: "bg-cyan-500/15",
      text: "text-cyan-400 classic:text-cyan-600",
      ring: "ring-cyan-500/25 classic:ring-cyan-200",
      lightBg: "classic:bg-cyan-50",
    },
    violet: {
      bg: "bg-violet-500/15",
      text: "text-violet-400 classic:text-violet-600",
      ring: "ring-violet-500/25 classic:ring-violet-200",
      lightBg: "classic:bg-violet-50",
    },
    orange: {
      bg: "bg-orange-500/15",
      text: "text-orange-400 classic:text-orange-600",
      ring: "ring-orange-500/25 classic:ring-orange-200",
      lightBg: "classic:bg-orange-50",
    },
  };
  const t = tones[tone];
  return (
    <Card hover className="group">
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 transition-transform duration-200 group-hover:scale-105",
              t.bg,
              t.text,
              t.ring,
              t.lightBg
            )}
          >
            <AppIcon icon={icon} size="lg" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-400 classic:text-slate-500">{label}</div>
          <div className="text-2xl font-bold tracking-tight text-white classic-canvas:text-slate-900">{value}</div>
          {hint && <div className="text-xs text-slate-500">{hint}</div>}
        </div>
      </div>
    </Card>
  );
}

// ---------------- Badge ----------------
export const badgeTones = {
  slate:
    "bg-white/10 text-slate-300 ring-white/15 classic:bg-slate-100 classic:text-slate-600 classic:ring-slate-200/80",
  indigo:
    "bg-indigo-500/15 text-indigo-300 ring-indigo-500/25 classic:bg-indigo-50 classic:text-indigo-700 classic:ring-indigo-200",
  blue: "bg-blue-500/15 text-blue-300 ring-blue-500/25 classic:bg-blue-50 classic:text-blue-700 classic:ring-blue-200",
  sky: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/25 classic:bg-sky-50 classic:text-sky-700 classic:ring-sky-200",
  violet:
    "bg-violet-500/15 text-violet-300 ring-violet-500/25 classic:bg-violet-50 classic:text-violet-700 classic:ring-violet-200",
  emerald:
    "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25 classic:bg-emerald-50 classic:text-emerald-700 classic:ring-emerald-200",
  amber:
    "bg-amber-500/15 text-amber-300 ring-amber-500/25 classic:bg-amber-50 classic:text-amber-700 classic:ring-amber-200",
  orange:
    "bg-orange-500/15 text-orange-300 ring-orange-500/25 classic:bg-orange-50 classic:text-orange-700 classic:ring-orange-200",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-500/25 classic:bg-rose-50 classic:text-rose-700 classic:ring-rose-200",
} as const;

export type BadgeTone = keyof typeof badgeTones;

const badgeDots: Record<BadgeTone, string> = {
  slate: "bg-slate-400 classic:bg-slate-500",
  indigo: "bg-indigo-400 classic:bg-indigo-500",
  blue: "bg-blue-400 classic:bg-blue-500",
  sky: "bg-cyan-400 classic:bg-sky-500",
  violet: "bg-violet-400 classic:bg-violet-500",
  emerald: "bg-emerald-400 classic:bg-emerald-500",
  amber: "bg-amber-400 classic:bg-amber-500",
  orange: "bg-orange-400 classic:bg-orange-500",
  rose: "bg-rose-400 classic:bg-rose-500",
};

export function Badge({
  className,
  tone,
  dot,
  children,
}: {
  className?: string;
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ring-1 ring-inset",
        tone ? badgeTones[tone] : badgeTones.slate,
        className
      )}
    >
      {dot && tone && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", badgeDots[tone])} />}
      {children}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "emerald" : "slate"} dot>
      {active ? "Faol" : "Faol emas"}
    </Badge>
  );
}

// ---------------- Button styles ----------------
const btnBase =
  "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas classic:focus-visible:ring-offset-white";

export const btn = {
  primary: cn(
    btnBase,
    "rounded-xl bg-gradient-to-b from-blue-500 to-brand-600 px-4 py-2.5 text-sm text-white shadow-md shadow-blue-600/30 hover:from-blue-400 hover:to-blue-500 hover:shadow-lg hover:shadow-blue-500/35 focus-visible:ring-brand-400"
  ),
  accent: cn(
    btnBase,
    "rounded-xl bg-gradient-to-b from-orange-500 to-accent px-4 py-2.5 text-sm text-white shadow-md shadow-orange-500/30 hover:from-orange-400 hover:to-orange-500 hover:shadow-lg hover:shadow-orange-500/35 focus-visible:ring-orange-400"
  ),
  secondary: cn(
    btnBase,
    "rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm backdrop-blur hover:border-white/20 hover:bg-white/10 focus-visible:ring-brand-400 classic:border-slate-200 classic:bg-white classic:text-slate-700 classic:shadow-sm classic:backdrop-blur-none classic:hover:border-slate-300 classic:hover:bg-slate-50"
  ),
  danger: cn(
    btnBase,
    "rounded-xl bg-gradient-to-b from-rose-500 to-rose-600 px-4 py-2.5 text-sm text-white shadow-md shadow-rose-600/25 hover:from-rose-400 hover:to-rose-500 hover:shadow-lg hover:shadow-rose-500/30 focus-visible:ring-rose-400"
  ),
  ghost: cn(
    btnBase,
    "rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white focus-visible:ring-brand-400 classic:text-slate-500 classic:hover:bg-slate-100 classic:hover:text-slate-900"
  ),
  small: cn(
    btnBase,
    "rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm backdrop-blur hover:border-white/20 hover:bg-white/10 focus-visible:ring-brand-400 classic:border-slate-200 classic:bg-white classic:text-slate-600 classic:shadow-sm classic:backdrop-blur-none classic:hover:border-slate-300 classic:hover:bg-slate-50"
  ),
  dangerSmall: cn(
    btnBase,
    "rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 focus-visible:ring-rose-400 classic:border-rose-200 classic:bg-rose-50 classic:text-rose-700 classic:hover:bg-rose-100"
  ),
  primarySmall: cn(
    btnBase,
    "rounded-lg border border-blue-500/30 bg-blue-500/15 px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-500/25 focus-visible:ring-blue-400 classic:border-blue-200 classic:bg-blue-50 classic:text-blue-700 classic:hover:bg-blue-100"
  ),
};

export type BtnVariant = keyof typeof btn;

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button type="button" className={cn(btn[variant], className)} {...props}>
      {children}
    </button>
  );
}

// ---------------- Form elements ----------------
export const inputCls = "glass-input";
export const selectCls = "glass-select";
export const textareaCls = "glass-textarea";
export const fileCls = "glass-file";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const isFile = props.type === "file";
  return <input className={cn(isFile ? fileCls : inputCls, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(selectCls, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textareaCls, className)} {...props} />;
}

export function Label({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block", htmlFor && "cursor-pointer")}>
      <span className="text-sm font-medium text-slate-300 classic:text-slate-700">
        {children}
        {required && <span className="text-rose-400 classic:text-rose-500"> *</span>}
      </span>
      {hint && <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

export function Alert({
  variant = "info",
  className,
  children,
}: {
  variant?: "success" | "error" | "warning" | "info";
  className?: string;
  children: React.ReactNode;
}) {
  const styles = {
    success:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 classic:border-emerald-200 classic:bg-emerald-50 classic:text-emerald-800",
    error:
      "border-rose-500/25 bg-rose-500/10 text-rose-300 classic:border-rose-200 classic:bg-rose-50 classic:text-rose-800",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-300 classic:border-amber-200 classic:bg-amber-50 classic:text-amber-800",
    info: "border-blue-500/25 bg-blue-500/10 text-blue-300 classic:border-blue-200 classic:bg-blue-50 classic:text-blue-800",
  };
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium",
        styles[variant],
        variant === "error" && "animate-shake",
        className
      )}
    >
      {children}
    </div>
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
const stickyActionsShadow =
  "shadow-[-8px_0_16px_-8px_rgb(0_0_0/0.35)] classic-canvas:shadow-[-8px_0_12px_-8px_rgb(15_23_42/0.06)]";

const stickyThCls =
  "sticky right-0 z-20 whitespace-nowrap bg-surface/95 px-4 py-3 text-right font-semibold backdrop-blur-md classic-canvas:bg-slate-50";

const stickyTdCls =
  "sticky right-0 z-10 bg-surface/95 px-4 py-3 align-middle backdrop-blur-md group-hover/row:bg-surface-hover/95 classic-canvas:bg-white classic-canvas:group-hover/row:bg-slate-50";

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
    <div className={cn("glass-card overflow-hidden !p-0", className)}>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-slate-400 classic-canvas:border-slate-200 classic-canvas:bg-slate-50 classic-canvas:text-slate-500">
              {head}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 classic-canvas:divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function ThActions({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={cn(stickyThCls, stickyActionsShadow, className)}>
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle text-slate-300 classic-canvas:text-slate-600", className)}>
      {children}
    </td>
  );
}

export function TdActions({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={cn(stickyTdCls, stickyActionsShadow, className)}>
      {children}
    </td>
  );
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
        className={cn("rounded-full object-cover ring-2 ring-white/20", sizes[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 font-semibold text-blue-300 ring-2 ring-white/15",
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
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-white/10 classic:bg-slate-100", className)}>
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-brand-500 via-blue-500 to-cyan-400 shadow-sm shadow-blue-500/30 transition-all duration-500 ease-out",
          barClassName
        )}
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
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex cursor-pointer items-center gap-1 rounded-lg px-1 py-0.5 text-xs font-medium text-slate-500 transition hover:text-blue-400"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Orqaga
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white classic-canvas:text-slate-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400 classic-canvas:text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

// ---------------- Empty state ----------------
export function EmptyState({
  icon = Inbox,
  title,
  hint,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center classic-canvas:border-slate-200 classic-canvas:bg-slate-50">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400 ring-1 ring-white/10 classic-canvas:bg-white classic-canvas:text-slate-500 classic-canvas:ring-slate-200">
        <AppIcon icon={icon} size="xl" />
      </div>
      <div className="text-sm font-semibold text-slate-200 classic-canvas:text-slate-800">{title}</div>
      {hint && <div className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">{hint}</div>}
      {action && <div className="mt-5">{action}</div>}
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
    <div className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 shadow-sm backdrop-blur classic:border-slate-200 classic:bg-slate-100 classic:shadow-none classic:backdrop-blur-none">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition duration-150",
            current === t.key
              ? "bg-gradient-to-b from-blue-500 to-brand-600 text-white shadow-md shadow-blue-600/25 classic:shadow-sm"
              : "text-slate-400 hover:bg-white/5 hover:text-white classic:text-slate-600 classic:hover:bg-white classic:hover:text-slate-900"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ---------------- Link accent (sahifalar ichidagi "Barchasi →" havolalar) ----------------
export const linkAccent =
  "cursor-pointer text-xs font-medium text-blue-400 transition hover:text-blue-300 classic-canvas:text-blue-600 classic-canvas:hover:text-blue-700";
