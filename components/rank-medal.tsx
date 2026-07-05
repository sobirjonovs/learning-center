import { Award, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACE_CONFIG = {
  1: { Icon: Crown, color: "text-amber-400", ring: "ring-amber-400/30" },
  2: { Icon: Medal, color: "text-slate-300", ring: "ring-slate-300/30" },
  3: { Icon: Award, color: "text-orange-500", ring: "ring-orange-500/30" },
} as const;

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

const badgeSizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-9 w-9 text-sm",
  xl: "h-11 w-11 text-base",
} as const;

export function RankMedal({
  place,
  size = "md",
  className,
  showBadge = false,
}: {
  place: number;
  size?: keyof typeof sizes;
  className?: string;
  /** O'rin raqamini doira ichida ko'rsatish (jadval uchun) */
  showBadge?: boolean;
}) {
  const config = PLACE_CONFIG[place as 1 | 2 | 3];

  if (!config) {
    if (showBadge) {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-white/10 font-bold text-slate-400 ring-1 ring-white/10",
            badgeSizes[size],
            className
          )}
        >
          {place}
        </span>
      );
    }
    return (
      <span className={cn("font-bold text-slate-400", className)} aria-hidden>
        {place}
      </span>
    );
  }

  const { Icon, color, ring } = config;

  if (showBadge) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-white/5 ring-1",
          ring,
          badgeSizes[size],
          className
        )}
      >
        <Icon className={cn(sizes[size], color)} strokeWidth={1.75} aria-hidden />
      </span>
    );
  }

  return <Icon className={cn(sizes[size], color, className)} strokeWidth={1.75} aria-hidden />;
}

export function RankLabel({ place, className }: { place: number; className?: string }) {
  const labels: Record<number, string> = {
    1: "1-o'rin",
    2: "2-o'rin",
    3: "3-o'rin",
  };
  const colors: Record<number, string> = {
    1: "text-amber-400",
    2: "text-slate-300",
    3: "text-orange-400",
  };

  return (
    <span className={cn("font-display text-xs font-bold uppercase tracking-wide", colors[place], className)}>
      {labels[place] ?? `#${place}`}
    </span>
  );
}
