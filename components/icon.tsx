import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type { LucideIcon };

const sizes = {
  xs: "h-3.5 w-3.5",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

export function AppIcon({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return <Icon className={cn(sizes[size], "shrink-0", className)} strokeWidth={1.75} aria-hidden />;
}
