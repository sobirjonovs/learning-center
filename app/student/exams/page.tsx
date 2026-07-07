// O'quvchining imtihonlari ro'yxati
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { examViewStatus } from "@/lib/exam";
import { EXAM_VIEW_STATUS, type ExamViewStatus } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";
import { ClipboardList, Inbox, Star } from "lucide-react";
import { Badge, EmptyState, LinkTabs, PageHeader } from "@/components/ui";

const TABS = [
  { key: "barchasi", label: "Barchasi" },
  { key: "faol", label: "Faol" },
  { key: "topshirilgan", label: "Topshirilgan" },
  { key: "tekshirilgan", label: "Tekshirilgan" },
  { key: "otkazilgan", label: "O'tkazib yuborilgan" },
] as const;

const TAB_FILTER: Record<string, ExamViewStatus[]> = {
  faol: ["ACTIVE", "IN_PROGRESS"],
  topshirilgan: ["SUBMITTED"],
  tekshirilgan: ["CHECKED"],
  otkazilgan: ["MISSED", "UPCOMING"],
};

export default async function StudentExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRole("STUDENT");
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as string) : "barchasi";
  const now = new Date();

  const exams = await db.exam.findMany({
    where: {
      group: { students: { some: { studentId: session.id } } },
    },
    include: {
      group: { select: { name: true } },
      results: { where: { studentId: session.id } },
    },
    orderBy: { endAt: "desc" },
  });

  const rows = exams.map((exam) => {
    const result = exam.results[0] ?? null;
    return { exam, result, status: examViewStatus(exam, result, now) };
  });
  const filter = TAB_FILTER[tab];
  const visible = filter ? rows.filter((r) => filter.includes(r.status)) : rows;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={
          <span className="font-display inline-flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-violet-400" strokeWidth={1.75} />
            Imtihonlarim
          </span>
        }
        subtitle="Guruhlaringizdagi imtihonlar — vaqtida topshiring!"
      />

      <LinkTabs
        current={tab}
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          href: t.key === "barchasi" ? "/student/exams" : `/student/exams?tab=${t.key}`,
        }))}
      />

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Bu bo'limda imtihon yo'q"
          hint="Boshqa bo'limlarni ham ko'rib chiqing yoki keyinroq qaytib keling."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ exam, result, status }) => {
            const st = EXAM_VIEW_STATUS[status];
            const graded = result?.status === "ACCEPTED" && result.score !== null;
            return (
              <Link key={exam.id} href={`/student/exams/${exam.id}`} className="group">
                <div className="game-card flex h-full animate-slide-up flex-col p-5 transition group-hover:-translate-y-1 group-hover:border-violet-500/30">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-2xl">📝</div>
                    <Badge className={st.badge}>{st.label}</Badge>
                  </div>
                  <div className="font-semibold text-white group-hover:text-violet-300">
                    {exam.title}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{exam.group.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    ⏰ {fmtDateTime(exam.startAt)} — {fmtDateTime(exam.endAt)}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-xs text-slate-400">
                      O&apos;tish: {exam.passPercent}% · Maks: {exam.maxScore}
                    </span>
                    {graded && (
                      <Badge
                        className={
                          result!.passed
                            ? "inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-400"
                            : "inline-flex items-center gap-1 bg-rose-500/15 text-rose-400"
                        }
                      >
                        <Star className="h-3 w-3" strokeWidth={1.75} />
                        {result!.score} · {result!.passed ? "O'tdi" : "Yiqildi"}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
