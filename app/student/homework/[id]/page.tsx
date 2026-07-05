// Vazifa sahifasi — tafsilotlar, topshirish formasi va natija
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeworkViewStatus } from "@/lib/homework";
import { computeHomeworkScore } from "@/lib/gamification";
import { HOMEWORK_VIEW_STATUS, RATES } from "@/lib/constants";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import { AlertTriangle, Hourglass, PartyPopper, RotateCcw, Send } from "lucide-react";
import { Badge, Card, CardTitle, PageHeader } from "@/components/ui";
import { SubmissionForm } from "./submission-form";

export default async function StudentHomeworkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireRole("STUDENT");
  const now = new Date();

  // Faqat o'z guruhidagi vazifani ko'ra oladi
  const hw = await db.homework.findFirst({
    where: { id, group: { students: { some: { studentId: session.id } } } },
    include: {
      group: { select: { name: true } },
      teacher: { select: { name: true } },
    },
  });
  if (!hw) notFound();

  const sub = await db.submission.findUnique({
    where: { homeworkId_studentId: { homeworkId: hw.id, studentId: session.id } },
  });

  const status = homeworkViewStatus(hw, sub, now);
  const st = HOMEWORK_VIEW_STATUS[status];
  const overdue = now > hw.dueAt;
  const canSubmit = !sub || sub.status === "RETURNED";
  const preview = computeHomeworkScore(hw.maxScore, hw.dueAt, now, hw.earlyBonus, hw.latePenalty);

  return (
    <div className="animate-fade-in">
      <PageHeader
        backHref="/student/homework"
        title={hw.title}
        subtitle={`${hw.group.name}${hw.teacher ? ` · ${hw.teacher.name}` : ""}`}
        action={<Badge className={st.badge}>{st.label}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chap ustun — tafsilotlar */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="animate-slide-up">
            <CardTitle>📋 Vazifa tafsilotlari</CardTitle>
            {hw.description ? (
              <p className="whitespace-pre-line text-sm text-slate-300">{hw.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Tavsif berilmagan.</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Boshlanish</div>
                <div className="text-sm font-semibold text-slate-100">{fmtDateTime(hw.startAt)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Muddat (deadline)</div>
                <div className="text-sm font-semibold text-slate-100">{fmtDateTime(hw.dueAt)}</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Maksimal ball</div>
                <div className="text-sm font-semibold text-slate-100">{hw.maxScore} ball</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="text-xs text-slate-400">Guruh</div>
                <div className="text-sm font-semibold text-slate-100">{hw.group.name}</div>
              </div>
            </div>

            {(hw.earlyBonus > 0 || hw.latePenalty > 0) && (
              <div className="mt-4 space-y-1 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-sm">
                <div className="text-xs font-semibold text-blue-300">Bonus va jarima shartlari</div>
                {hw.earlyBonus > 0 && (
                  <div className="text-emerald-400">🎁 Har bir kun oldin: +{hw.earlyBonus} ball</div>
                )}
                {hw.latePenalty > 0 && (
                  <div className="inline-flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                    Har bir kechikkan kun: -{hw.latePenalty} ball
                  </div>
                )}
              </div>
            )}

            {hw.earlyBonus > 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-white/10 bg-white/5 p-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Ball hisoblash misoli:</span>{" "}
                Asosiy: {hw.maxScore} · 2 kun oldin: +{hw.earlyBonus * 2} · Yakuniy:{" "}
                <span className="font-bold text-emerald-400">{hw.maxScore + hw.earlyBonus * 2}</span>
                {hw.latePenalty > 0 && (
                  <>
                    {" "}
                    | 1 kun kech: -{hw.latePenalty} · Yakuniy:{" "}
                    <span className="font-bold text-rose-400">
                      {Math.max(0, hw.maxScore - hw.latePenalty)}
                    </span>
                  </>
                )}
              </div>
            )}

            {(hw.fileUrl || hw.link) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {hw.fileUrl && (
                  <a
                    href={hw.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:bg-white/5"
                  >
                    📎 Biriktirilgan fayl
                  </a>
                )}
                {hw.link && (
                  <a
                    href={hw.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-200 shadow-sm transition hover:bg-white/5"
                  >
                    🔗 Qo&apos;shimcha havola
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* Tekshirilgan natija */}
          {sub && sub.status === "ACCEPTED" && (
            <Card className="animate-pop border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-surface to-blue-500/5" glow="blue">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <PartyPopper className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                  Natijangiz
                </span>
              </CardTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-3 text-center shadow-sm">
                  <div className="text-xs text-slate-400">Asosiy ball</div>
                  <div className="text-xl font-bold text-slate-100">{sub.baseScore ?? 0}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-xs text-slate-400">Bonus</div>
                  <div className="text-xl font-bold text-emerald-400">+{sub.bonus}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3 text-center">
                  <div className="text-xs text-slate-400">Jarima</div>
                  <div className="text-xl font-bold text-rose-400">-{sub.penalty}</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-700/80 to-blue-500/70 p-4 text-center text-white glow-blue">
                <div className="font-display text-xs uppercase tracking-wide text-blue-200">Yakuniy ball</div>
                <div className="font-display text-4xl font-extrabold">{sub.score ?? 0}</div>
                <div className="mt-1 text-xs text-blue-100">
                  +{fmtNumber(Math.round((sub.score ?? 0) * RATES.homeworkXp))} XP · +
                  {fmtNumber(Math.round((sub.score ?? 0) * RATES.homeworkPoints))} ball olindi
                </div>
              </div>
              {sub.feedback && (
                <div className="mt-4 rounded-xl bg-white/5 p-3">
                  <div className="text-xs font-semibold text-slate-500">O&apos;qituvchi izohi</div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{sub.feedback}</p>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* O'ng ustun — topshirish */}
        <div className="space-y-6 lg:col-span-2">
          {canSubmit && (
            <Card className="animate-slide-up">
              <CardTitle>
                {sub?.status === "RETURNED" ? (
                  <span className="inline-flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                    Qayta topshirish
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Send className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
                    Vazifani topshirish
                  </span>
                )}
              </CardTitle>

              {sub?.status === "RETURNED" && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <div className="font-semibold text-amber-300">Vazifa qayta ishlashga qaytarildi</div>
                  {sub.feedback && (
                    <p className="mt-1 whitespace-pre-line text-amber-200/80">{sub.feedback}</p>
                  )}
                </div>
              )}

              {overdue && hw.latePenalty > 0 && (
                <div className="mb-4 animate-pulse-soft flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  Muddat o&apos;tgan — jarima qo&apos;llanadi
                </div>
              )}
              {overdue && hw.latePenalty === 0 && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
                  ⏰ Muddat o&apos;tgan — imkon qadar tezroq bajaring
                </div>
              )}

              {!overdue && preview.bonus > 0 && (
                <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
                  🎁 Hozir topshirsangiz: taxminan +{preview.bonus} bonus ball ({preview.daysEarly}{" "}
                  kun oldin)
                </div>
              )}
              {overdue && preview.penalty > 0 && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-300">
                  📉 Hozir topshirsangiz: taxminan -{preview.penalty} jarima ({preview.daysLate} kun
                  kechikish)
                </div>
              )}

              <SubmissionForm homeworkId={hw.id} resubmit={sub?.status === "RETURNED"} />
            </Card>
          )}

          {sub && sub.status === "SUBMITTED" && (
            <Card className="animate-slide-up border-cyan-400/30 bg-cyan-400/5">
              <div className="flex items-center gap-3">
                <Hourglass className="h-10 w-10 shrink-0 animate-float text-cyan-400" strokeWidth={1.75} />
                <div>
                  <div className="font-semibold text-white">Tekshirilmoqda</div>
                  <div className="text-xs text-slate-500">
                    Vazifangiz o&apos;qituvchiga yuborildi. Natija tez orada chiqadi.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* O'z topshirig'i haqida ma'lumot */}
          {sub && (
            <Card className="animate-slide-up">
              <CardTitle>📤 Mening topshirig&apos;im</CardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500">Topshirilgan vaqt</span>
                  <span className="font-medium text-slate-100">{fmtDateTime(sub.submittedAt)}</span>
                </div>
                {sub.submittedAt > hw.dueAt && (
                  <div className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300">
                    Kechikib topshirilgan
                  </div>
                )}
                {sub.link && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Havola</span>
                    <a
                      href={sub.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[60%] truncate font-medium text-blue-400 hover:underline"
                    >
                      {sub.link}
                    </a>
                  </div>
                )}
                {sub.fileUrl && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Fayl</span>
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-400 hover:underline"
                    >
                      📎 Yuklab olish
                    </a>
                  </div>
                )}
                {sub.comment && (
                  <div className="rounded-xl bg-white/5 p-3">
                    <div className="text-xs font-semibold text-slate-500">Izohim</div>
                    <p className="mt-1 whitespace-pre-line text-slate-300">{sub.comment}</p>
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
