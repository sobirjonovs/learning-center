"use client";

// Guruh tanlash — o'zgarganda sahifani yangi query bilan ochadi
import { useRouter } from "next/navigation";

export function GroupSelect({
  groups,
  current,
  davr,
}: {
  groups: Array<{ id: string; name: string }>;
  current: string;
  davr: string;
}) {
  const router = useRouter();
  return (
    <select
      value={current}
      onChange={(e) => router.push(`/student/rating?group=${e.target.value}&davr=${davr}`)}
      className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
      aria-label="Guruhni tanlash"
    >
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
