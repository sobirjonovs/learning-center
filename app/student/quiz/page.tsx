// O'quvchi: quizga qo'shilish (PIN kiritish) + so'nggi natijalar
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtNumber } from "@/lib/utils";
import { Gamepad2, Zap } from "lucide-react";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { RankMedal } from "@/components/rank-medal";
import { PinForm } from "./pin-form";

export default async function StudentQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("STUDENT");
  const { error } = await searchParams;

  const results = await db.quizResult.findMany({
    where: { studentId: session.id },
    include: { quiz: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="relative animate-slide-up overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-900/90 via-blue-700/85 to-blue-600/75 p-8 text-center text-white shadow-xl shadow-blue-600/30 glow-blue md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgb(34_211_238/0.06),transparent_50%)]" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="animate-float flex justify-center">
            <Zap className="h-16 w-16 text-amber-300" strokeWidth={1.5} fill="currentColor" />
          </div>
          <h1 className="font-display mt-3 text-3xl font-black neon-text">Quiz Battle</h1>
          <p className="mt-1 text-sm text-blue-100">
            O&apos;qituvchingiz ekranidagi 6 xonali PIN kodni kiriting
          </p>

          {error === "notfound" && (
            <div className="mt-4 animate-shake rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-200">
              Bunday PIN bilan o&apos;yin topilmadi yoki u allaqachon tugagan
            </div>
          )}

          <PinForm />
        </div>
      </div>

      <Card glow="blue">
        <CardTitle>
          <span className="font-display">So&apos;nggi natijalarim</span>
        </CardTitle>
        {results.length === 0 ? (
          <EmptyState
            icon={Gamepad2}
            title="Hali quiz o'ynamagansiz"
            hint="Birinchi o'yiningizdan keyin natijalar shu yerda ko'rinadi."
          />
        ) : (
          <div className="divide-y divide-white/5">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <span className="flex w-9 justify-center">
                  {r.place ? (
                    <RankMedal place={r.place} size="sm" showBadge />
                  ) : (
                    <span className="font-display text-sm font-bold text-slate-400">—</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{r.quiz.name}</div>
                  <div className="text-xs text-slate-400">
                    {r.place ? `${r.place}-o'rin · ` : ""}
                    {fmtDate(r.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-sm font-black text-cyan-400">
                    {fmtNumber(r.score)}
                  </div>
                  <div className="text-xs text-slate-400">ball</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
