// Gamifikatsiya UI komponentlari — o'quvchi kabineti uchun (ko'k monoton tema)
import Link from "next/link";
import { Calendar, Flame, Lock, ShoppingBag, Star, Zap } from "lucide-react";
import { AppIcon, type LucideIcon } from "@/components/icon";
import { RankMedal, RankLabel } from "@/components/rank-medal";
import { cn } from "@/lib/utils";
import { Avatar, ProgressBar } from "./ui";

/** O'quvchi kabineti — ko'k linear gradient tugmalar */
export const gameBtn =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-600 hover:via-blue-500 hover:to-cyan-500 active:scale-[0.98] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

export const gameBtnLg =
  "inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-4 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/30 transition hover:from-blue-600 hover:via-blue-500 hover:to-cyan-500 active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

// ---------------- O'yinchi hero paneli ----------------
export function GameHero({
  name,
  image,
  level,
  streak,
  points,
  xpProgress,
  xpLabel,
}: {
  name: string;
  image?: string | null;
  level: number;
  streak: number;
  points: string;
  xpProgress: number;
  xpLabel: string;
}) {
  return (
    <div className="game-hero relative animate-slide-up overflow-hidden rounded-2xl p-6 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(37_99_235/0.15),transparent_40%,rgb(34_211_238/0.08))] classic:hidden" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-blue-600/20 blur-3xl classic:hidden" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl classic:hidden" />
      <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_70%_60%_at_0%_0%,rgb(59_130_246/0.08),transparent_55%),radial-gradient(ellipse_50%_50%_at_100%_100%,rgb(34_211_238/0.06),transparent_50%)] classic:block" />

      <div className="relative flex flex-wrap items-center gap-5">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 opacity-60 blur-sm classic:opacity-40 classic:blur-[2px]" />
          <Avatar
            name={name}
            image={image}
            size="xl"
            className="relative ring-4 ring-blue-500/40 classic:ring-blue-200"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-blue-400/40 bg-blue-600/90 px-2.5 py-0.5 font-display text-xs font-bold text-white shadow-lg shadow-blue-500/40 classic:border-blue-300 classic:bg-blue-600 classic:shadow-md">
            LVL {level}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/80 classic:text-blue-600">
            Xush kelibsiz, o&apos;yinchi!
          </div>
          <h1 className="font-display truncate text-2xl font-bold tracking-tight text-white classic:text-slate-900 md:text-3xl">
            {name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <GameChip icon={Flame} label={`${streak} kun streak`} tone="orange" />
            <GameChip icon={Star} label={`${points} ball`} tone="gold" />
            <GameChip icon={Zap} label={`Level ${level}`} tone="blue" />
          </div>
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-400 classic:text-slate-500">
              <span>{xpLabel}</span>
              <span className="font-display font-bold text-cyan-400 classic:text-blue-600">
                {Math.round(xpProgress)}%
              </span>
            </div>
            <XpBar value={xpProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- XP progress bar ----------------
export function XpBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("xp-bar-track", className)}>
      <div className="xp-bar-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ---------------- O'yin chip/badge ----------------
export function GameChip({
  icon,
  label,
  tone = "blue",
}: {
  icon?: LucideIcon;
  label: string;
  tone?: "blue" | "cyan" | "gold" | "orange" | "emerald" | "rose";
}) {
  const tones: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/15 text-blue-300 classic:border-blue-200 classic:bg-blue-50 classic:text-blue-700",
    cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300 classic:border-cyan-200 classic:bg-cyan-50 classic:text-cyan-700",
    gold: "border-amber-400/30 bg-amber-400/10 text-amber-300 classic:border-amber-200 classic:bg-amber-50 classic:text-amber-700",
    orange: "border-orange-500/30 bg-orange-500/15 text-orange-300 classic:border-orange-200 classic:bg-orange-50 classic:text-orange-700",
    emerald: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 classic:border-emerald-200 classic:bg-emerald-50 classic:text-emerald-700",
    rose: "border-rose-500/30 bg-rose-500/15 text-rose-300 classic:border-rose-200 classic:bg-rose-50 classic:text-rose-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone]
      )}
    >
      {icon && <AppIcon icon={icon} size="xs" className="opacity-90" />}
      {label}
    </span>
  );
}

// ---------------- O'yin stat kartasi ----------------
export function GameStat({
  label,
  value,
  icon,
  hint,
  tone = "blue",
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  tone?: "blue" | "cyan" | "gold" | "emerald" | "rose";
}) {
  const accents: Record<string, { ring: string; glow: string; text: string; lightBg: string }> = {
    blue: {
      ring: "ring-blue-500/25 classic:ring-blue-200",
      glow: "from-blue-600/20 classic:from-blue-100",
      text: "text-blue-400 classic:text-blue-600",
      lightBg: "classic:bg-blue-50",
    },
    cyan: {
      ring: "ring-cyan-400/25 classic:ring-cyan-200",
      glow: "from-cyan-400/20 classic:from-cyan-100",
      text: "text-cyan-400 classic:text-cyan-600",
      lightBg: "classic:bg-cyan-50",
    },
    gold: {
      ring: "ring-amber-400/25 classic:ring-amber-200",
      glow: "from-amber-400/20 classic:from-amber-100",
      text: "text-amber-400 classic:text-amber-600",
      lightBg: "classic:bg-amber-50",
    },
    emerald: {
      ring: "ring-emerald-500/25 classic:ring-emerald-200",
      glow: "from-emerald-500/20 classic:from-emerald-100",
      text: "text-emerald-400 classic:text-emerald-600",
      lightBg: "classic:bg-emerald-50",
    },
    rose: {
      ring: "ring-rose-500/25 classic:ring-rose-200",
      glow: "from-rose-500/20 classic:from-rose-100",
      text: "text-rose-400 classic:text-rose-600",
      lightBg: "classic:bg-rose-50",
    },
  };
  const a = accents[tone];
  return (
    <div className="game-card group relative overflow-hidden p-4 transition hover:-translate-y-0.5">
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition group-hover:opacity-100", a.glow)} />
      <div className="relative flex items-center gap-4">
        {icon && (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 transition group-hover:scale-105",
              a.ring,
              a.text,
              a.lightBg
            )}
          >
            <AppIcon icon={icon} size="lg" />
          </div>
        )}
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-slate-400 classic:text-slate-500">{label}</div>
          <div className={cn("font-display text-2xl font-bold tracking-tight text-white classic:text-slate-900", a.text)}>
            {value}
          </div>
          {hint && <div className="truncate text-xs text-slate-500">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

// ---------------- Quest / vazifa kartasi ----------------
export function QuestCard({
  href,
  title,
  subtitle,
  badge,
  badgeClass,
  urgent,
  footer,
}: {
  href?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  badgeClass?: string;
  urgent?: boolean;
  footer?: React.ReactNode;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-100 classic:text-slate-800">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
      </div>
      {badge && (
        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", badgeClass)}>
          {badge}
        </span>
      )}
    </>
  );

  const cls = cn(
    "flex items-center justify-between gap-3 rounded-xl border p-3 transition",
    urgent
      ? "quest-urgent border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/15 classic:border-rose-200 classic:bg-rose-50 classic:hover:bg-rose-100"
      : "border-white/10 bg-white/[0.03] hover:border-blue-500/30 hover:bg-blue-500/5 classic:border-slate-200 classic:bg-slate-50 classic:hover:border-blue-200 classic:hover:bg-blue-50"
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
        {footer}
      </Link>
    );
  }
  return (
    <div className={cls}>
      {inner}
      {footer}
    </div>
  );
}

// ---------------- Yutuq plitasi ----------------
export function AchievementTile({
  icon,
  name,
  href,
  earned,
  description,
  xpReward,
  pointsReward,
  earnedAt,
  progress,
  progressLabel,
}: {
  icon: string;
  name: string;
  href?: string;
  earned?: boolean;
  description?: string;
  xpReward?: number;
  pointsReward?: number;
  earnedAt?: string;
  progress?: number;
  progressLabel?: string;
}) {
  const content = (
    <div
      className={cn(
        "game-card relative overflow-hidden p-4 transition",
        earned ? "achievement-earned animate-pop" : "opacity-60 grayscale"
      )}
    >
      {!earned && (
        <div className="absolute right-3 top-3 opacity-70">
          <Lock className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
        </div>
      )}
      {earned && (
        <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/20 blur-xl" />
      )}
      <div className="relative text-4xl">{icon}</div>
      <div className="relative mt-2 font-display font-bold text-white classic:text-slate-900">{name}</div>
      {description && <div className="relative mt-0.5 text-xs text-slate-400">{description}</div>}
      <div className="relative mt-3 flex flex-wrap gap-1.5">
        {xpReward != null && xpReward > 0 && (
          <GameChip label={`+${xpReward} XP`} tone="blue" />
        )}
        {pointsReward != null && pointsReward > 0 && (
          <GameChip label={`+${pointsReward} ball`} tone="gold" />
        )}
      </div>
      {earnedAt && (
        <div className="relative mt-2 flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="h-3 w-3" strokeWidth={1.75} />
          {earnedAt}
        </div>
      )}
      {!earned && progress != null && progressLabel && (
        <div className="relative mt-3">
          <div className="mb-1 text-xs font-medium text-slate-500">{progressLabel}</div>
          <ProgressBar value={progress} barClassName="from-blue-600 to-cyan-400" />
        </div>
      )}
    </div>
  );

  if (href && earned) {
    return (
      <Link href={href} className="block transition hover:-translate-y-0.5">
        {content}
      </Link>
    );
  }
  return content;
}

// ---------------- Podium slot ----------------
export function PodiumSlot({
  place,
  name,
  image,
  level,
  xp,
  points,
  isMe,
  first,
}: {
  place: number;
  name: string;
  image?: string | null;
  level: number;
  xp: string;
  points: string;
  isMe?: boolean;
  first?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex animate-bounce-in flex-col items-center rounded-2xl border p-4 text-center transition",
        first
          ? "podium-first w-44 -translate-y-3 pb-7 sm:w-52"
          : "game-card w-40 sm:w-44",
        isMe && "ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-canvas"
      )}
    >
      <div className={cn("animate-float flex flex-col items-center gap-1", first ? "mb-1" : "mb-0.5")}>
        <RankMedal place={place} size={first ? "xl" : "lg"} />
        <RankLabel place={place} />
      </div>
      <Avatar name={name} image={image} size={first ? "xl" : "lg"} className="my-2" />
      <div className="w-full truncate text-sm font-semibold text-white classic:text-slate-900">
        {name}
        {isMe && <span className="text-cyan-400 classic:text-blue-600"> (Siz)</span>}
      </div>
      <GameChip label={`Level ${level}`} tone="blue" />
      <div className={cn("font-display mt-2 font-bold text-white classic:text-slate-900", first ? "text-2xl" : "text-lg")}>
        {xp} XP
      </div>
      <div className="flex items-center justify-center gap-1 text-xs text-amber-400/80 classic:text-amber-600">
        <Star className="h-3 w-3" strokeWidth={1.75} />
        {points} ball
      </div>
    </div>
  );
}

// ---------------- Balans paneli (magazin) ----------------
export function CoinBalance({ points }: { points: string }) {
  return (
    <div className="coin-balance relative mb-6 animate-slide-up overflow-hidden rounded-2xl p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-blue-400/10 blur-2xl" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="font-display text-xs font-semibold uppercase tracking-widest text-blue-200/70">
            Sizning balansingiz
          </div>
          <div className="font-display mt-1 text-3xl font-extrabold text-white flex items-center gap-2">
            <Star className="h-7 w-7 text-amber-400" strokeWidth={1.75} />
            {points} <span className="text-lg font-semibold text-blue-200/80">ball</span>
          </div>
        </div>
        <div className="hidden animate-float sm:block text-blue-300/60">
          <ShoppingBag className="h-14 w-14" strokeWidth={1.25} />
        </div>
      </div>
    </div>
  );
}

// ---------------- O'yin xabarlari ----------------
export function GameAlert({
  type,
  children,
}: {
  type: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 animate-pop",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-300 animate-shake",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  };
  return (
    <div className={cn("mb-6 rounded-xl border px-4 py-3 text-sm font-medium", styles[type])}>
      {children}
    </div>
  );
}

// ---------------- Header HUD (ball + XP) ----------------
export function PlayerHud({
  level,
  points,
  xpProgress,
}: {
  level: number;
  points: string;
  xpProgress: number;
}) {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <div className="flex items-center gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 classic:border-amber-200 classic:bg-amber-50">
        <Star className="h-4 w-4 text-amber-400 classic:text-amber-500" strokeWidth={1.75} />
        <span className="font-display text-sm font-bold text-blue-300 classic:text-amber-700">{points}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 classic:border-blue-200 classic:bg-blue-50">
        <span className="font-display text-xs font-bold text-blue-300 classic:text-blue-700">LVL {level}</span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10 classic:bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
