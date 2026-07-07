// Imtihon sahifasi — tafsilotlar, topshirish va natija
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { examViewStatus } from "@/lib/exam";
import { getGamificationSettings } from "@/lib/gamification";
import { EXAM_VIEW_STATUS } from "@/lib/constants";
import { fmtDateTime, fmtNumber, pct } from "@/lib/utils";
import { AlertTriangle, Hourglass, PartyPopper, RotateCcw, Send } from "lucide-react";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";
import { ExamSubmissionForm } from "./submission-form";

export default async function StudentExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("STUDENT");
  const now = new Date();

  const exam = await db.exam.findFirst({
    where: { id, group: { students: { some: { studentId: session.id } } } },
    include: { group: { select: { name: true } } },
  });
  if (!exam) notFound();

  const { exam: examRates } = await getGamificationSettings();

  const result = await db.examResult.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId: session.id } },
  });

  const status = examViewStatus(exam, result, now);
  const st = EXAM_VIEW_STATUS[status];
  const notStarted = now < exam.startAt;
  const ended = now > exam.endAt;
  const canSubmit =
    !notStarted && !ended && (!result || result.status === "RETURNED");

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/student/exams"
        title={exam.title}
        subtitle={exam.group.name}
        action={<Badge className={st.badge}>{st.label}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card className="animate-slide-up">
            <CardTitle>📋 Imtihon tafsilotlari</CardTitle>
            {exam.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={exam.imageUrl}
                alt=""
                className="mb-4 max-h-56 w-full rounded-xl border border-white/10 object-cover"
              />
            )}
            {exam.description ? (
              <p className="whitespace-pre-line text-sm text-slate-300">{exam.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Tavsif berilmagan.</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Boshlanish</div>
                <div className="text-sm font-semibold text-slate-100">{fmtDateTime(exam.startAt)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Tugash</div>
                <div className="text-sm font-semibold text-slate-100">{fmtDateTime(exam.endAt)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Ball oralig&apos;i</div>
                <div className="text-sm font-semibold text-slate-100">
                  {exam.minScore} – {exam.maxScore}
                </div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">O&apos;tish foizi</div>
                <div className="text-sm font-semibold text-slate-100">{exam.passPercent}%</div>
              </div>
            </div>

            {(exam.fileUrl || exam.link) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {exam.fileUrl && (
                  <a
                    href={exam.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                  >
                    📎 Biriktirilgan fayl
                  </a>
                )}
                {exam.link && (
                  <a
                    href={exam.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                  >
                    🔗 Qo&apos;shimcha havola
                  </a>
                )}
              </div>
            )}
          </Card>

          {result && result.status === "ACCEPTED" && result.score !== null && (
            <Card
              className={`animate-pop border ${
                result.passed ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10" : "border-rose-500/30 bg-gradient-to-br from-rose-500/10"
              } via-surface to-blue-500/5`}
              glow="blue"
            >
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                  Natijangiz
                </span>
              </CardTitle>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="font-display text-xs uppercase tracking-wide text-slate-400">
                  Ball / Foiz
                </div>
                <div className="font-display text-4xl font-extrabold text-slate-100">
                  {result.score}/{exam.maxScore}
                </div>
                <div className="mt-1 text-sm text-slate-400">{pct(result.score, exam.maxScore)}%</div>
                <Badge
                  className={`mt-3 ${
                    result.passed
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-rose-500/15 text-rose-400"
                  }`}
                >
                  {result.passed ? "O'tdi" : "Yiqildi"}
                </Badge>
                <div className="mt-3 text-xs text-slate-400">
                  +{fmtNumber(Math.round(result.score * examRates.xpRate))} XP · +
                  {fmtNumber(Math.round(result.score * examRates.pointRate))} ball
                  {result.score >= exam.maxScore && examRates.perfectBonus > 0 && (
                    <> · +{fmtNumber(examRates.perfectBonus)} bonus (100%)</>
                  )}
                </div>
              </div>
              {result.feedback && (
                <div className="mt-4 rounded-xl bg-white/5 p-3">
                  <div className="text-xs font-semibold text-slate-500">O&apos;qituvchi izohi</div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{result.feedback}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {notStarted && (
            <Card className="animate-slide-up border-slate-500/30 bg-slate-500/5">
              <div className="text-sm text-slate-300">
                Imtihon hali boshlanmagan. Boshlanish: {fmtDateTime(exam.startAt)}
              </div>
            </Card>
          )}

          {canSubmit && (
            <Card className="animate-slide-up">
              <CardTitle>
                {result?.status === "RETURNED" ? (
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                    Qayta topshirish
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4 text-violet-400" strokeWidth={1.75} />
                    Imtihonni topshirish
                  </span>
                )}
              </CardTitle>

              {result?.status === "RETURNED" && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <div className="font-semibold text-amber-300">Qayta ishlashga yuborildi</div>
                  {result.feedback && (
                    <p className="mt-1 whitespace-pre-line text-amber-200/80">{result.feedback}</p>
                  )}
                </div>
              )}

              <ExamSubmissionForm examId={exam.id} resubmit={result?.status === "RETURNED"} />
            </Card>
          )}

          {ended && !result && (
            <Card className="animate-slide-up border-rose-500/30 bg-rose-500/5">
              <div className="flex items-center gap-2 text-sm font-medium text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                Imtihon vaqti tugagan — topshiriq qabul qilinmaydi
              </div>
            </Card>
          )}

          {result && result.status === "SUBMITTED" && (
            <Card className="animate-slide-up border-cyan-400/30 bg-cyan-400/5">
              <div className="flex items-center gap-3">
                <Hourglass className="h-10 w-10 shrink-0 animate-float text-cyan-400" strokeWidth={1.75} />
                <div>
                  <div className="font-semibold text-white">Tekshirilmoqda</div>
                  <div className="text-xs text-slate-500">
                    Topshirig&apos;ingiz o&apos;qituvchiga yuborildi. Natija tez orada chiqadi.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {result && (
            <Card className="animate-slide-up">
              <CardTitle>📤 Mening topshirig&apos;im</CardTitle>
              <div className="space-y-2 text-sm">
                {result.submittedAt && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Topshirilgan vaqt</span>
                    <span className="font-medium text-slate-100">{fmtDateTime(result.submittedAt)}</span>
                  </div>
                )}
                {result.link && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Havola</span>
                    <a
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[60%] truncate font-medium text-blue-400 hover:underline"
                    >
                      {result.link}
                    </a>
                  </div>
                )}
                {result.fileUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Fayl</span>
                    <a
                      href={result.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-400 hover:underline"
                    >
                      📎 Yuklab olish
                    </a>
                  </div>
                )}
                {result.comment && (
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs font-semibold text-slate-500">Javobim</div>
                    <p className="mt-1 whitespace-pre-line text-slate-300">{result.comment}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
