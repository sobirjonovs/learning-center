// Super admin dashboard — umumiy ko'rsatkichlar, grafiklar va reytinglar
import Link from "next/link";
import { requireRole, can } from "@/lib/auth";
import { db } from "@/lib/db";
import { weekdayNameFor, PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import { levelFromXp } from "@/lib/gamification";
import {
  addDays,
  dateStr,
  fmtDate,
  fmtNumber,
  parseJsonArray,
  pct,
  startOfWeek,
  timeAgo,
  todayStr,
} from "@/lib/utils";
import { Calendar, CheckCircle2, GraduationCap, ShoppingBag, UserCog, Users } from "lucide-react";
import { Avatar, Badge, Card, CardTitle, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { BarChart, LineChart } from "@/components/charts";

const MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

const isPresent = (s: string) => s === "PRESENT" || s === "LATE";

export default async function AdminDashboardPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  const showShop = can(session, "shop.manage");

  const now = new Date();
  const today = todayStr();
  const since = dateStr(addDays(now, -34));

  const [teachers, students, groups, recentAttendance, attendanceByGroup, activities, shopPurchases] =
    await Promise.all([
    db.user.findMany({
      where: { role: "TEACHER" },
      select: {
        id: true,
        name: true,
        image: true,
        teacherType: true,
        active: true,
        _count: { select: { teachingGroups: { where: { active: true } } } },
      },
    }),
    db.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, image: true, xp: true, active: true, createdAt: true },
    }),
    db.group.findMany({ select: { id: true, name: true, days: true, active: true } }),
    db.attendance.findMany({ where: { date: { gte: since } }, select: { date: true, status: true } }),
    db.attendance.groupBy({ by: ["groupId", "status"], _count: { _all: true } }),
    db.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    showShop
      ? db.purchase.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { student: true, product: true },
        })
      : Promise.resolve([]),
  ]);

  // ---- Stat kartalar ----
  const activeTeachers = teachers.filter((t) => t.active).length;
  const activeStudents = students.filter((s) => s.active).length;
  const activeGroups = groups.filter((g) => g.active);
  const todayWeekday = weekdayNameFor(now);
  const todayLessons = activeGroups.filter((g) => parseJsonArray(g.days).includes(todayWeekday)).length;
  const todayRows = recentAttendance.filter((r) => r.date === today);
  const todayPct = pct(todayRows.filter((r) => isPresent(r.status)).length, todayRows.length);

  // ---- O'quvchilar o'sishi (oxirgi 6 oy, kumulyativ) ----
  const growth = Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    return {
      label: MONTH_SHORT[m.getMonth()],
      value: students.filter((s) => s.createdAt < end).length,
    };
  });

  // ---- Haftalik davomat (oxirgi 7 kun, % bilan) ----
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(now, i - 6);
    const ds = dateStr(day);
    const rows = recentAttendance.filter((r) => r.date === ds);
    return {
      label: weekdayNameFor(day).slice(0, 2),
      value: pct(rows.filter((r) => isPresent(r.status)).length, rows.length),
    };
  });

  // ---- Oylik davomat (oxirgi 5 hafta, o'rtacha %) ----
  const thisWeek = startOfWeek(now);
  const monthly = Array.from({ length: 5 }, (_, i) => {
    const start = addDays(thisWeek, -7 * (4 - i));
    const end = addDays(start, 6);
    const s = dateStr(start);
    const e = dateStr(end);
    const rows = recentAttendance.filter((r) => r.date >= s && r.date <= e);
    return {
      label: fmtDate(start).slice(0, 5),
      value: pct(rows.filter((r) => isPresent(r.status)).length, rows.length),
    };
  });

  // ---- Eng faol o'qituvchilar (faol guruhlari soni bo'yicha) ----
  const topTeachers = [...teachers]
    .sort((a, b) => b._count.teachingGroups - a._count.teachingGroups)
    .slice(0, 5);

  // ---- Eng yaxshi guruhlar (o'rtacha davomat % bo'yicha) ----
  const byGroup = new Map<string, { present: number; total: number }>();
  for (const row of attendanceByGroup) {
    const cur = byGroup.get(row.groupId) ?? { present: 0, total: 0 };
    cur.total += row._count._all;
    if (isPresent(row.status)) cur.present += row._count._all;
    byGroup.set(row.groupId, cur);
  }
  const bestGroups = groups
    .map((g) => {
      const stat = byGroup.get(g.id) ?? { present: 0, total: 0 };
      return { ...g, total: stat.total, percent: pct(stat.present, stat.total) };
    })
    .filter((g) => g.total > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);

  // ---- Eng yuqori reytingdagi o'quvchilar ----
  const topStudents = [...students]
    .filter((s) => s.active)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="O'quv markazining umumiy ko'rsatkichlari va faoliyat tahlili"
      />

      {/* Stat kartalar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Faol o'qituvchilar"
          value={fmtNumber(activeTeachers)}
          icon={UserCog}
          tone="indigo"
          hint={`Jami: ${fmtNumber(teachers.length)} ta`}
        />
        <StatCard
          label="Faol o'quvchilar"
          value={fmtNumber(activeStudents)}
          icon={GraduationCap}
          tone="violet"
          hint={`Jami: ${fmtNumber(students.length)} ta`}
        />
        <StatCard
          label="Faol guruhlar"
          value={fmtNumber(activeGroups.length)}
          icon={Users}
          tone="sky"
          hint={`Jami: ${fmtNumber(groups.length)} ta`}
        />
        <StatCard
          label="Bugungi darslar"
          value={fmtNumber(todayLessons)}
          icon={Calendar}
          tone="amber"
          hint={todayWeekday}
        />
        <StatCard
          label="Bugungi davomat"
          value={`${todayPct}%`}
          icon={CheckCircle2}
          tone="emerald"
          hint={`${fmtNumber(todayRows.length)} ta yozuv`}
        />
      </div>

      {/* Grafiklar */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardTitle>O'quvchilar o'sishi</CardTitle>
          <LineChart data={growth} />
        </Card>
        <Card>
          <CardTitle>Haftalik davomat</CardTitle>
          <BarChart data={weekly} suffix="%" maxValue={100} color="#10b981" />
        </Card>
        <Card>
          <CardTitle>Oylik davomat (haftalar kesimida)</CardTitle>
          <BarChart data={monthly} suffix="%" maxValue={100} />
        </Card>
      </div>

      {/* Ro'yxatlar */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle
            action={
              <Link href="/admin/teachers" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                Barchasi →
              </Link>
            }
          >
            Eng faol o'qituvchilar
          </CardTitle>
          {topTeachers.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">O'qituvchilar yo'q</p>
          ) : (
            <div className="space-y-3">
              {topTeachers.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <Avatar name={t.name} image={t.image} size="sm" />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/teachers/${t.id}`}
                      className="block truncate text-sm font-medium text-slate-100 hover:text-blue-400"
                    >
                      {t.name}
                    </Link>
                    <div className="text-xs text-slate-400">{t.teacherType ?? "O'qituvchi"}</div>
                  </div>
                  <Badge className="bg-blue-500/15 text-blue-400">
                    {t._count.teachingGroups} ta faol guruh
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle
            action={
              <Link href="/admin/groups" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                Barchasi →
              </Link>
            }
          >
            Eng yaxshi guruhlar
          </CardTitle>
          {bestGroups.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Davomat ma'lumotlari yo'q</p>
          ) : (
            <div className="space-y-3.5">
              {bestGroups.map((g) => (
                <div key={g.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <Link
                      href={`/admin/groups/${g.id}`}
                      className="truncate text-sm font-medium text-slate-100 hover:text-blue-400"
                    >
                      {g.name}
                    </Link>
                    <span className="text-sm font-semibold text-slate-200">{g.percent}%</span>
                  </div>
                  <ProgressBar value={g.percent} barClassName="bg-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle
            action={
              <Link href="/admin/students" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                Barchasi →
              </Link>
            }
          >
            Eng yuqori reytingdagi o'quvchilar
          </CardTitle>
          {topStudents.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">O'quvchilar yo'q</p>
          ) : (
            <div className="space-y-3">
              {topStudents.map((s, i) => {
                const lvl = levelFromXp(s.xp);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
                    <Avatar name={s.name} image={s.image} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/students/${s.id}`}
                        className="block truncate text-sm font-medium text-slate-100 hover:text-blue-400"
                      >
                        {s.name}
                      </Link>
                      <div className="text-xs text-slate-400">{lvl.level}-daraja</div>
                    </div>
                    <Badge className="bg-violet-500/15 text-violet-400">{fmtNumber(s.xp)} XP</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>So&apos;nggi tizim faoliyatlari</CardTitle>
          {activities.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Faoliyat qayd etilmagan</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <Avatar name={a.user?.name ?? "Tizim"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-100 classic:text-slate-700">
                      <span className="font-semibold">{a.user?.name ?? "Tizim"}</span> — {a.action}
                    </div>
                    {a.detail && <div className="truncate text-xs text-slate-400">{a.detail}</div>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {showShop && (
          <Card>
            <CardTitle
              action={
                <Link href="/admin/shop/history" className="text-xs font-medium text-blue-400 hover:text-blue-300">
                  Barchasi →
                </Link>
              }
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-400" strokeWidth={1.75} />
                Magazin xaridlari
              </span>
            </CardTitle>
            {shopPurchases.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Hozircha xaridlar yo&apos;q</p>
            ) : (
              <div className="space-y-3">
                {shopPurchases.map((p) => {
                  const st = PURCHASE_STATUS[p.status as PurchaseStatus] ?? PURCHASE_STATUS.NEW;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar name={p.student.name} image={p.student.image} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-100 classic:text-slate-800">
                          {p.student.name}
                        </div>
                        <div className="truncate text-xs text-slate-400">
                          {p.product.name} · {fmtNumber(p.points)} ball
                        </div>
                      </div>
                      <Badge className={st.badge}>{st.label}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
