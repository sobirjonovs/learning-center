// Vazifa sahifasi — tafsilotlar, topshirish formasi va natija
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { homeworkViewStatus } from "@/lib/homework";
import { computeHomeworkScore } from "@/lib/gamification";
import { HOMEWORK_VIEW_STATUS, RATES } from "@/lib/constants";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
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
              <p className="whitespace-pre-line text-sm text-slate-700">{hw.description}</p>
            ) : (
              <p className="text-sm text-slate-400">Tavsif berilmagan.</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Boshlanish</div>
                <div className="text-sm font-semibold text-slate-800">{fmtDateTime(hw.startAt)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Muddat (deadline)</div>
                <div className="text-sm font-semibold text-slate-800">{fmtDateTime(hw.dueAt)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Maksimal ball</div>
                <div className="text-sm font-semibold text-slate-800">{hw.maxScore} ball</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-400">Guruh</div>
                <div className="text-sm font-semibold text-slate-800">{hw.group.name}</div>
              </div>
            </div>

            {(hw.earlyBonus > 0 || hw.latePenalty > 0) && (
              <div className="mt-4 space-y-1 rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-sm">
                <div className="text-xs font-semibold text-violet-700">Bonus va jarima shartlari</div>
                {hw.earlyBonus > 0 && (
                  <div className="text-emerald-700">🎁 Har bir kun oldin: +{hw.earlyBonus} ball</div>
                )}
                {hw.latePenalty > 0 && (
                  <div className="text-rose-700">⚠️ Har bir kechikkan kun: -{hw.latePenalty} ball</div>
                )}
              </div>
            )}

            {hw.earlyBonus > 0 && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Ball hisoblash misoli:</span>{" "}
                Asosiy: {hw.maxScore} · 2 kun oldin: +{hw.earlyBonus * 2} · Yakuniy:{" "}
                <span className="font-bold text-emerald-600">{hw.maxScore + hw.earlyBonus * 2}</span>
                {hw.latePenalty > 0 && (
                  <>
                    {" "}
                    | 1 kun kech: -{hw.latePenalty} · Yakuniy:{" "}
                    <span className="font-bold text-rose-600">
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
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    📎 Biriktirilgan fayl
                  </a>
                )}
                {hw.link && (
                  <a
                    href={hw.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    🔗 Qo&apos;shimcha havola
                  </a>
                )}
              </div>
            )}
          </Card>

          {/* Tekshirilgan natija */}
          {sub && sub.status === "ACCEPTED" && (
            <Card className="animate-pop border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-white">
              <CardTitle>🎉 Natijangiz</CardTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                  <div className="text-xs text-slate-400">Asosiy ball</div>
                  <div className="text-xl font-bold text-slate-800">{sub.baseScore ?? 0}</div>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                  <div className="text-xs text-slate-400">Bonus</div>
                  <div className="text-xl font-bold text-emerald-600">+{sub.bonus}</div>
                </div>
                <div className="rounded-xl bg-white p-3 text-center shadow-sm">
                  <div className="text-xs text-slate-400">Jarima</div>
                  <div className="text-xl font-bold text-rose-600">-{sub.penalty}</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 text-center text-white">
                <div className="text-xs uppercase tracking-wide text-violet-100">Yakuniy ball</div>
                <div className="text-4xl font-extrabold">{sub.score ?? 0}</div>
                <div className="mt-1 text-xs text-violet-100">
                  +{fmtNumber(Math.round((sub.score ?? 0) * RATES.homeworkXp))} XP · +
                  {fmtNumber(Math.round((sub.score ?? 0) * RATES.homeworkPoints))} ball olindi
                </div>
              </div>
              {sub.feedback && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-500">O&apos;qituvchi izohi</div>
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{sub.feedback}</p>
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
                {sub?.status === "RETURNED" ? "🔄 Qayta topshirish" : "🚀 Vazifani topshirish"}
              </CardTitle>

              {sub?.status === "RETURNED" && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm">
                  <div className="font-semibold text-amber-800">Vazifa qayta ishlashga qaytarildi</div>
                  {sub.feedback && (
                    <p className="mt-1 whitespace-pre-line text-amber-700">{sub.feedback}</p>
                  )}
                </div>
              )}

              {overdue && hw.latePenalty > 0 && (
                <div className="mb-4 animate-pulse-soft rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  ⚠️ Muddat o&apos;tgan — jarima qo&apos;llanadi
                </div>
              )}
              {overdue && hw.latePenalty === 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                  ⏰ Muddat o&apos;tgan — imkon qadar tezroq topshiring
                </div>
              )}

              {!overdue && preview.bonus > 0 && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  🎁 Hozir topshirsangiz: taxminan +{preview.bonus} bonus ball ({preview.daysEarly}{" "}
                  kun oldin)
                </div>
              )}
              {overdue && preview.penalty > 0 && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  📉 Hozir topshirsangiz: taxminan -{preview.penalty} jarima ({preview.daysLate} kun
                  kechikish)
                </div>
              )}

              <SubmissionForm homeworkId={hw.id} resubmit={sub?.status === "RETURNED"} />
            </Card>
          )}

          {sub && sub.status === "SUBMITTED" && (
            <Card className="animate-slide-up border-sky-200 bg-sky-50/50">
              <div className="flex items-center gap-3">
                <div className="animate-float text-4xl">⏳</div>
                <div>
                  <div className="font-semibold text-slate-900">Tekshirilmoqda</div>
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
                  <span className="font-medium text-slate-800">{fmtDateTime(sub.submittedAt)}</span>
                </div>
                {sub.submittedAt > hw.dueAt && (
                  <div className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
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
                      className="max-w-[60%] truncate font-medium text-violet-600 hover:underline"
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
                      className="font-medium text-violet-600 hover:underline"
                    >
                      📎 Yuklab olish
                    </a>
                  </div>
                )}
                {sub.comment && (
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-500">Izohim</div>
                    <p className="mt-1 whitespace-pre-line text-slate-700">{sub.comment}</p>
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
