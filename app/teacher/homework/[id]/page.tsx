// Uyga vazifani tekshirish (baholash) sahifasi
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { SUBMISSION_STATUS, type SubmissionStatus } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";
import { computeHomeworkScore } from "@/lib/gamification";
import { Hourglass, Inbox, Scale, Target } from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  Field,
  PageHeader,
  StatCard,
  btn,
  inputCls,
} from "@/components/ui";
import { gradeSubmission } from "../actions";

function timingInfo(daysEarly: number, daysLate: number): { text: string; cls: string } {
  if (daysEarly > 0)
    return { text: `${daysEarly} kun oldin topshirdi`, cls: "text-emerald-600" };
  if (daysLate > 0)
    return { text: `${daysLate} kun kechikib topshirdi`, cls: "text-rose-600" };
  return { text: "O'z vaqtida topshirdi", cls: "text-slate-500" };
}

export default async function HomeworkGradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const hw = await db.homework.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          students: {
            include: { student: { select: { id: true, name: true, image: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
      submissions: true,
    },
  });
  if (!hw || hw.group.teacherId !== session.id) redirect("/teacher/homework");

  const subByStudent = new Map(hw.submissions.map((s) => [s.studentId, s]));
  const submittedCount = hw.submissions.length;
  const ungradedCount = hw.submissions.filter((s) => s.status === "SUBMITTED").length;

  return (
    <div>
      <PageHeader
        title={hw.title}
        subtitle={`${hw.group.name} · Muddat: ${fmtDateTime(hw.dueAt)}`}
        backHref="/teacher/homework"
        action={
          <Link href={`/teacher/homework/${hw.id}/edit`} className={btn.secondary}>
            Tahrirlash
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Maksimal ball" value={hw.maxScore} icon={Target} tone="indigo" />
        <StatCard
          label="Erta bonus / kech jarima"
          value={`+${hw.earlyBonus} / -${hw.latePenalty}`}
          icon={Scale}
          tone="violet"
          hint="Har bir kun uchun"
        />
        <StatCard
          label="Topshirdi"
          value={`${submittedCount}/${hw.group.students.length}`}
          icon={Inbox}
          tone="sky"
        />
        <StatCard label="Tekshirilmagan" value={ungradedCount} icon={Hourglass} tone="amber" />
      </div>

      {(hw.description || hw.fileUrl || hw.link) && (
        <Card className="mb-6">
          {hw.description && (
            <p className="whitespace-pre-line text-sm text-slate-600">{hw.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {hw.fileUrl && (
              <a href={hw.fileUrl} target="_blank" className="font-medium text-blue-400 hover:underline">
                📎 Vazifa fayli
              </a>
            )}
            {hw.link && (
              <a href={hw.link} target="_blank" className="font-medium text-blue-400 hover:underline">
                🔗 Vazifa havolasi
              </a>
            )}
          </div>
        </Card>
      )}

      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        O'quvchilar topshiriqlari ({hw.group.students.length})
      </h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {hw.group.students.map((m) => {
          const sub = subByStudent.get(m.student.id);
          if (!sub) {
            return (
              <Card key={m.student.id} className="bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.student.name} image={m.student.image} size="sm" />
                    <span className="text-sm font-medium text-slate-500">{m.student.name}</span>
                  </div>
                  <Badge className="bg-slate-200 text-slate-500">Topshirmagan</Badge>
                </div>
              </Card>
            );
          }

          const status = (sub.status in SUBMISSION_STATUS ? sub.status : "SUBMITTED") as SubmissionStatus;
          const defaultBase = sub.baseScore ?? hw.maxScore;
          const preview = computeHomeworkScore(
            defaultBase,
            hw.dueAt,
            sub.submittedAt,
            hw.earlyBonus,
            hw.latePenalty
          );
          const timing = timingInfo(preview.daysEarly, preview.daysLate);

          return (
            <Card key={m.student.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={m.student.name} image={m.student.image} size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{m.student.name}</div>
                    <div className="text-xs text-slate-400">
                      {fmtDateTime(sub.submittedAt)} · <span className={timing.cls}>{timing.text}</span>
                    </div>
                  </div>
                </div>
                <Badge className={SUBMISSION_STATUS[status].badge}>
                  {SUBMISSION_STATUS[status].label}
                </Badge>
              </div>

              {(sub.link || sub.fileUrl || sub.comment) && (
                <div className="mt-3 space-y-1.5 rounded-xl bg-white/5 p-3 text-sm">
                  {sub.link && (
                    <a href={sub.link} target="_blank" className="block truncate font-medium text-blue-400 hover:underline">
                      🔗 {sub.link}
                    </a>
                  )}
                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" className="block font-medium text-blue-400 hover:underline">
                      📎 Yuklangan fayl
                    </a>
                  )}
                  {sub.comment && <p className="text-slate-600">💬 {sub.comment}</p>}
                </div>
              )}

              {sub.status === "ACCEPTED" && sub.score !== null && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  Asosiy: {sub.baseScore ?? 0}, Bonus: +{sub.bonus}, Jarima: -{sub.penalty},{" "}
                  Yakuniy: <span className="font-bold">{sub.score}</span> / {hw.maxScore}
                </div>
              )}

              <form action={gradeSubmission} className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <input type="hidden" name="submissionId" value={sub.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={`Ball (0-${hw.maxScore})`}>
                    <input
                      type="number"
                      name="base"
                      min={0}
                      max={hw.maxScore}
                      defaultValue={sub.baseScore ?? ""}
                      placeholder={String(hw.maxScore)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Izoh">
                    <textarea
                      name="feedback"
                      rows={1}
                      defaultValue={sub.feedback ?? ""}
                      placeholder="O'quvchiga izoh..."
                      className={inputCls}
                    />
                  </Field>
                </div>
                <p className="text-xs text-slate-400">
                  Hisob-kitob (kiritilgan ball asosida qayta hisoblanadi): Asosiy: {preview.base},
                  Bonus: +{preview.bonus}, Jarima: -{preview.penalty}, Yakuniy: {preview.final}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="submit" name="decision" value="ACCEPT" className={btn.primary}>
                    Qabul qilish
                  </button>
                  <button type="submit" name="decision" value="RETURN" className={btn.secondary}>
                    Qayta ishlashga yuborish
                  </button>
                </div>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
