"use client";

import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Home,
  Medal,
  Phone,
  Rocket,
  Settings,
  Shield,
  ShoppingBag,
  Trophy,
  UserCog,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const NAV_ICONS = {
  "bar-chart3": BarChart3,
  bell: Bell,
  "book-open": BookOpen,
  "check-circle2": CheckCircle2,
  "clipboard-list": ClipboardList,
  "credit-card": CreditCard,
  "graduation-cap": GraduationCap,
  home: Home,
  medal: Medal,
  phone: Phone,
  rocket: Rocket,
  settings: Settings,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  trophy: Trophy,
  "user-cog": UserCog,
  users: Users,
  zap: Zap,
} as const satisfies Record<string, LucideIcon>;

export type NavIconName = keyof typeof NAV_ICONS;

export function resolveNavIcon(name: NavIconName): LucideIcon {
  return NAV_ICONS[name];
}
