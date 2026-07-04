// O'qituvchining guruhlari ro'yxati
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonArray, pct } from "@/lib/utils";
import { ActiveBadge, Badge, Card, EmptyState, PageHeader, ProgressBar, btn } from "@/components/ui";

export default async function TeacherGroupsPage() {
  const session = await requireRole("TEACHER");

  const groups = await db.group.findMany({
    where: { teacherId: session.id },
    include: { _count: { select: { students: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const attByGroup = await db.attendance.groupBy({
    by: ["groupId", "status"],
    where: { groupId: { in: groups.map((g) => g.id) } },
    _count: { _all: true },
  });
  const groupAtt = new Map<string, { present: number; total: number }>();
  for (const row of attByGroup) {
    const cur = groupAtt.get(row.groupId) ?? { present: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "PRESENT" || row.status === "LATE") cur.present += row._count._all;
    groupAtt.set(row.groupId, cur);
  }

  return (
    <div>
      <PageHeader title="Guruhlarim" subtitle="Sizga biriktirilgan guruhlar ro'yxati" />

      {groups.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Sizga hali guruh biriktirilmagan"
          hint="Administrator guruh biriktirgach, bu yerda ko'rinadi."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g) => {
            const att = groupAtt.get(g.id);
            const percent = att ? pct(att.present, att.total) : 0;
            const days = parseJsonArray(g.days);
            return (
              <Card key={g.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-base font-bold text-slate-900">{g.name}</div>
                    {g.type && <div className="text-xs text-slate-400">{g.type}</div>}
                  </div>
                  <ActiveBadge active={g.active} />
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{days.length > 0 ? days.join(", ") : "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{g.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🚪</span>
                    <span>{g.room ? `${g.room}-xona` : "Xona belgilanmagan"}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <Badge className="bg-indigo-100 text-indigo-700">{g._count.students} o'quvchi</Badge>
                    <span>Davomat: {percent}%</span>
                  </div>
                  <ProgressBar value={percent} />
                </div>

                <Link href={`/teacher/groups/${g.id}`} className={btn.secondary}>
                  Batafsil
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
