import type { BadgeTone } from "@/components/ui";
import { isSocialStudent } from "@/lib/constants";

export type PaymentStatus = "PAID" | "PARTIAL" | "UNPAID" | "NO_FEE" | "EXEMPT";

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  PAID: { label: "To'landi", tone: "emerald" },
  PARTIAL: { label: "Qisman", tone: "amber" },
  UNPAID: { label: "To'lanmadi", tone: "rose" },
  NO_FEE: { label: "Narx yo'q", tone: "slate" },
  EXEMPT: { label: "Ijtimoiy (to'lovsiz)", tone: "sky" },
};

export function currentMonth(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildPriceMap(
  prices: Array<{ subjectId: string; groupType: string; monthlyFee: number }>
): Map<string, number> {
  const map = new Map<string, number>();
  for (const p of prices) map.set(`${p.subjectId}:${p.groupType}`, p.monthlyFee);
  return map;
}

export function expectedMonthlyFee(
  priceMap: Map<string, number>,
  subjectId: string | null | undefined,
  groupType: string | null | undefined,
  studentType?: string | null
): number | null {
  if (isSocialStudent(studentType)) return 0;
  if (!subjectId) return null;
  const priceType = groupType === "Individual" ? "Individual" : "Umumiy";
  return priceMap.get(`${subjectId}:${priceType}`) ?? null;
}

export function paymentStatus(
  paid: number,
  fee: number | null,
  studentType?: string | null
): PaymentStatus {
  if (isSocialStudent(studentType)) return "EXEMPT";
  if (!fee || fee <= 0) return "NO_FEE";
  if (paid >= fee) return "PAID";
  if (paid > 0) return "PARTIAL";
  return "UNPAID";
}
