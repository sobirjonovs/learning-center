// Umumiy yordamchi funksiyalar

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Mahalliy sana -> "YYYY-MM-DD" */
export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayStr(): string {
  return dateStr(new Date());
}

/** "04.07.2026" */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** "04.07.2026 14:30" */
export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return `${fmtDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** input[type=datetime-local] uchun qiymat */
export function toDatetimeLocal(d: Date | null | undefined): string {
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  return dateStr(d);
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return fmtDate(date);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function parseJsonArray<T = string>(s: string | null | undefined): T[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** To'liq kunlar farqi (a - b), musbat bo'lsa a keyinroq */
export function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

/** Haftaning boshi (dushanba, 00:00) */
export function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = dushanba
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfMonth(d = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  return date;
}

export function addDays(d: Date, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

export function fmtNumber(n: number): string {
  return n.toLocaleString("ru-RU"); // 8 450 ko'rinishida bo'sh joy bilan
}

/** Foiz (0-100), bo'linma nolga teng bo'lsa 0 */
export function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
