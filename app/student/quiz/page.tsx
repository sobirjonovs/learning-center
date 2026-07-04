// O'quvchi: quizga qo'shilish (PIN kiritish) + so'nggi natijalar
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtNumber } from "@/lib/utils";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { PinForm } from "./pin-form";

const MEDALS = ["🥇", "🥈", "🥉"];

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
      <div className="animate-slide-up rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-center text-white shadow-xl md:p-10">
        <div className="animate-float text-6xl">⚡</div>
        <h1 className="mt-3 text-3xl font-black">Quizga qo&apos;shilish</h1>
        <p className="mt-1 text-sm text-indigo-100">
          O&apos;qituvchingiz ekranidagi 6 xonali PIN kodni kiriting
        </p>

        {error === "notfound" && (
          <div className="mt-4 animate-shake rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/30">
            Bunday PIN bilan o&apos;yin topilmadi yoki u allaqachon tugagan
          </div>
        )}

        <PinForm />
      </div>

      <Card>
        <CardTitle>So&apos;nggi natijalarim</CardTitle>
        {results.length === 0 ? (
          <EmptyState
            icon="🎮"
            title="Hali quiz o'ynamagansiz"
            hint="Birinchi o'yiningizdan keyin natijalar shu yerda ko'rinadi."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {results.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <span className="w-9 text-center text-xl">
                  {r.place && r.place <= 3 ? (
                    MEDALS[r.place - 1]
                  ) : (
                    <span className="text-sm font-bold text-slate-400">{r.place ?? "—"}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {r.quiz.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {r.place ? `${r.place}-o'rin · ` : ""}
                    {fmtDate(r.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-black text-indigo-600">
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
