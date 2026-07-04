"use client";

// Sana bo'yicha filtr — o'zgarganda sahifani yangi sana bilan ochadi
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { inputCls } from "@/components/ui";

export function DateFilter({ date }: { date: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={date}
      onChange={(e) => {
        if (e.target.value) router.push(`/admin/absent?date=${e.target.value}`);
      }}
      className={cn(inputCls, "w-auto")}
      aria-label="Sana"
    />
  );
}
