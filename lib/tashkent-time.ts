// Toshkent vaqti (UTC+5, DST yo'q) bo'yicha sana/vaqt yordamchilari.

const TASHKENT_OFFSET_MS = 5 * 3_600_000;

export type TashkentDateParts = {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
  weekday: number; // 0=Yakshanba .. 6=Shanba
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Toshkent mahalliy sanasini qismlarga ajratadi */
export function getTashkentDateParts(d = new Date()): TashkentDateParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: weekdayMap[weekdayShort] ?? 0,
  };
}

/** Toshkentdagi YYYY-MM-DD */
export function tashkentDateKey(d = new Date()): string {
  const t = getTashkentDateParts(d);
  return `${t.year}-${pad(t.month)}-${pad(t.day)}`;
}

/** Toshkentdagi oy boshidagi 00:00 (UTC Date) */
export function tashkentMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - TASHKENT_OFFSET_MS);
}

/** Toshkentdagi berilgan sananing 00:00 (UTC Date) */
export function tashkentMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - TASHKENT_OFFSET_MS);
}

/** Joridagi yoki berilgan sananing yakshanba 00:00 (hafta yakshanbadan boshlanadi) */
export function startOfWeekSundayTashkent(d = new Date()): Date {
  const t = getTashkentDateParts(d);
  const sundayDay = t.day - t.weekday;
  return tashkentMidnight(t.year, t.month, sundayDay);
}
/** YYYY-MM davr kaliti */
export function monthPeriodKey(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}
