// O'quvchining uyga vazifalari ro'yxati (filtr bilan)
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeworkViewStatus } from "@/lib/homework";
import { HOMEWORK_VIEW_STATUS, type HomeworkViewStatus } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";
import { Badge, Card, EmptyState, LinkTabs, PageHeader } from "@/components/ui";

const TABS = [
  { key: "barchasi", label: "Barchasi" },
  { key: "faol", label: "Faol" },
  { key: "topshirilgan", label: "Topshirilgan" },
  { key: "tekshirilgan", label: "Tekshirilgan" },
  { key: "bajarilmadi", label: "Bajarilmadi" },
] as const;

const TAB_FILTER: Record<string, HomeworkViewStatus[]> = {
  faol: ["NEW", "IN_PROGRESS"],
  topshirilgan: ["SUBMITTED", "LATE"],
  tekshirilgan: ["CHECKED"],
  bajarilmadi: ["MISSED"],
};

export default async function StudentHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRole("STUDENT");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as string) : "barchasi";
  const now = new Date();

  const homeworks = await db.homework.findMany({
    where: {
      startAt: { lte: now },
      group: { students: { some: { studentId: session.id } } },
    },
    include: {
      group: { select: { name: true } },
      submissions: { where: { studentId: session.id } },
    },
    orderBy: { dueAt: "desc" },
  });

  const rows = homeworks.map((hw) => {
    const sub = hw.submissions[0] ?? null;
    return { hw, sub, status: homeworkViewStatus(hw, sub, now) };
  });
  const filter = TAB_FILTER[tab];
  const visible = filter ? rows.filter((r) => filter.includes(r.status)) : rows;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Vazifalarim 📚" subtitle="Guruhlaringizdagi barcha uyga vazifalar" />

      <LinkTabs
        current={tab}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          href: t.key === "barchasi" ? "/student/homework" : `/student/homework?tab=${t.key}`,
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Bu bo'limda vazifa yo'q"
          hint="Boshqa bo'limlarni ham ko'rib chiqing yoki keyinroq qaytib keling."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ hw, sub, status }) => {
            const st = HOMEWORK_VIEW_STATUS[status];
            const graded = sub?.status === "ACCEPTED" && sub.score !== null;
            return (
              <Link key={hw.id} href={`/student/homework/${hw.id}`} className="group">
                <Card className="flex h-full animate-slide-up flex-col transition group-hover:-translate-y-0.5 group-hover:shadow-md">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-2xl">📘</div>
                    <Badge className={st.badge}>{st.label}</Badge>
                  </div>
                  <div className="font-semibold text-slate-900 group-hover:text-violet-700">
                    {hw.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">👥 {hw.group.name}</div>
                  <div className="mt-1 text-xs text-slate-500">⏰ Muddat: {fmtDateTime(hw.dueAt)}</div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs text-slate-400">Maks: {hw.maxScore} ball</span>
                    {graded && (
                      <Badge className="bg-emerald-100 text-emerald-700">⭐ {sub!.score} ball</Badge>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
