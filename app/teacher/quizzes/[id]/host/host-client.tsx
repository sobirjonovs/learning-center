"use client";

// Host (o'qituvchi) taqdimot ekrani — SSE orqali jonlantiriladi
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn, fmtNumber } from "@/lib/utils";
import {
  BarChart3,
  Check,
  Flag,
  Flame,
  PartyPopper,
  Rocket,
  X,
  Zap,
} from "lucide-react";
import { ANSWER_SHAPES } from "@/lib/constants";
import type { HostView } from "@/lib/quiz-live";
import { RankMedal } from "@/components/rank-medal";

function fmtPin(pin: string): string {
  return `${pin.slice(0, 3)} ${pin.slice(3)}`;
}

export function HostClient({ pin, quizId }: { pin: string; quizId: string }) {
  const router = useRouter();
  const [view, setView] = useState<HostView | null>(null);
  const [connected, setConnected] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const offsetRef = useRef(0); // server vaqti - mijoz vaqti

  useEffect(() => {
    const es = new EventSource(`/api/quiz-live/${pin}/stream`);
    es.onmessage = (e) => {
      try {
        const v = JSON.parse(e.data) as HostView;
        offsetRef.current = v.now - Date.now();
        setView(v);
        setConnected(true);
      } catch {
        // noto'g'ri payload — e'tiborsiz
      }
    };
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);
    return () => es.close();
  }, [pin]);

  // Sanoq uchun tez tiklanadigan soat
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  const post = useCallback(
    (path: string, body?: Record<string, unknown>) =>
      fetch(`/api/quiz-live/${pin}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      }).catch(() => {}),
    [pin]
  );

  const finish = useCallback(async () => {
    await post("end");
    router.push("/teacher/quizzes");
  }, [post, router]);

  if (!view) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center app-canvas text-white">
        <div className="animate-pulse-soft text-xl font-semibold">Yuklanmoqda...</div>
      </div>
    );
  }

  const serverNow = nowTick + offsetRef.current;
  const remainingMs = Math.max(0, view.questionEndsAt - serverNow);
  const remainingSec = Math.ceil(remainingMs / 1000);
  const totalMs = view.question ? view.question.timeSeconds * 1000 : 1;
  const timeFrac = Math.min(1, Math.max(0, remainingMs / totalMs));
  const isLastQuestion = view.qIndex + 1 >= view.total;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto app-canvas text-white">
      {!connected && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 animate-pulse-soft rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold shadow-lg">
          Ulanish uzildi, qayta ulanilmoqda...
        </div>
      )}

      {/* ============ LOBBY ============ */}
      {view.phase === "LOBBY" && (
        <div className="flex min-h-full flex-col items-center justify-center gap-8 p-6 md:p-10">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
              Quiz Battle
            </div>
            <h1 className="mt-1 text-3xl font-black md:text-4xl">{view.quiz.name}</h1>
          </div>

          <div className="animate-pop rounded-3xl bg-white/10 px-10 py-8 text-center shadow-2xl ring-1 ring-white/20 backdrop-blur">
            <div className="text-sm font-bold uppercase tracking-[0.35em] text-indigo-200">
              Game PIN
            </div>
            <div className="mt-2 font-mono text-7xl font-black tracking-widest md:text-8xl">
              {fmtPin(view.pin)}
            </div>
            <div className="mt-3 text-sm text-indigo-200">
              O&apos;quvchilar &quot;Quiz o&apos;ynash&quot; sahifasida shu PIN ni kiritadi
            </div>
          </div>

          <div className="w-full max-w-4xl">
            <div className="mb-4 text-center text-lg font-semibold text-indigo-200">
              Qo&apos;shilganlar: <span className="text-2xl font-black text-white">{view.playerCount}</span>
            </div>
            {view.players.length === 0 ? (
              <div className="animate-pulse-soft text-center text-indigo-300">
                O&apos;quvchilarni kutamiz...
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {view.players.map((p) => (
                  <div
                    key={p.id}
                    className="group relative flex animate-bounce-in items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15"
                  >
                    <span className="text-4xl">{p.emoji}</span>
                    <span className="font-semibold">{p.name}</span>
                    <button
                      onClick={() => post("kick", { studentId: p.id })}
                      className="absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold shadow group-hover:flex"
                      title="O'yindan chiqarish"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => post("start")}
            disabled={view.playerCount === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-12 py-4 text-2xl font-black shadow-xl transition hover:bg-emerald-400 active:scale-95 disabled:opacity-40"
          >
            <Rocket className="h-6 w-6" strokeWidth={1.75} />
            Boshlash
          </button>
        </div>
      )}

      {/* ============ QUESTION / REVEAL ============ */}
      {(view.phase === "QUESTION" || view.phase === "REVEAL") && view.question && (
        <div className="flex min-h-full flex-col p-4 md:p-8">
          {/* Yuqori panel */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-indigo-300">{view.quiz.name}</div>
              <div className="text-lg font-black">
                Savol {view.qIndex + 1} / {view.total}
              </div>
            </div>

            {view.phase === "QUESTION" ? (
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-4xl font-black ring-4 ring-white/20",
                    remainingSec <= 5 && "animate-timer-urgent"
                  )}
                >
                  {remainingSec}
                </div>
                <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${timeFrac * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-full bg-white/10 px-5 py-2 text-lg font-bold ring-1 ring-white/20">
                ⏱ Vaqt tugadi
              </div>
            )}

            <div className="text-right">
              <div className="text-sm font-semibold text-indigo-300">Javob berdi</div>
              <div className="text-lg font-black">
                {view.answeredCount} / {view.playerCount}
              </div>
            </div>
          </div>

          {/* Savol */}
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-6">
            <h2 className="max-w-5xl text-center text-4xl font-bold leading-tight md:text-5xl">
              {view.question.text}
            </h2>
            {view.question.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={view.question.image}
                alt=""
                className="max-h-64 rounded-2xl object-contain shadow-lg"
              />
            )}
          </div>

          {/* Variantlar */}
          <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
            {view.question.options.map((opt, i) => {
              const s = ANSWER_SHAPES[i];
              const isReveal = view.phase === "REVEAL";
              const isCorrect = view.question!.correctIndex === i;
              const count = view.reveal?.counts[i] ?? 0;
              const maxCount = view.reveal ? Math.max(1, ...view.reveal.counts) : 1;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-2xl p-6 text-white shadow-lg transition-all duration-500",
                    s.bg,
                    isReveal && isCorrect && "scale-105 ring-4 ring-white",
                    isReveal && !isCorrect && "opacity-40 grayscale"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black drop-shadow">{s.shape}</span>
                    <span className="min-w-0 flex-1 text-2xl font-bold">{opt}</span>
                    {isReveal && isCorrect && <span className="text-3xl">✓</span>}
                  </div>
                  {isReveal && view.reveal && (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-black/25">
                        <div
                          className="h-full rounded-full bg-white/90 transition-all duration-700"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {count} o&apos;quvchi {isCorrect ? "✓" : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* REVEAL boshqaruvi */}
          {view.phase === "REVEAL" && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              {view.reveal && view.reveal.fastest.length > 0 ? (
                <div className="animate-slide-up rounded-2xl bg-white/10 px-5 py-3 ring-1 ring-white/15">
                  <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
                    <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Eng tez javob berganlar
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {view.reveal.fastest.map((f, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-sm font-semibold">
                        <span className="text-xl">{f.emoji}</span>
                        {f.name}
                        <span className="text-indigo-300">{(f.ms / 1000).toFixed(1)} s</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => post("next", { action: "leaderboard" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3 text-lg font-bold ring-1 ring-white/25 transition hover:bg-white/25 active:scale-95"
                >
                  <BarChart3 className="h-5 w-5" strokeWidth={1.75} />
                  Leaderboard
                </button>
                <button
                  onClick={() => post("next", { action: "next" })}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-lg font-bold transition hover:bg-emerald-400 active:scale-95"
                >
                  {isLastQuestion ? (
                    <>
                      <Flag className="h-5 w-5" strokeWidth={1.75} />
                      Yakuniy natijalar →
                    </>
                  ) : (
                    "Keyingi savol →"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ LEADERBOARD ============ */}
      {view.phase === "LEADERBOARD" && (
        <div className="flex min-h-full flex-col items-center justify-center p-6 md:p-10">
          <h2 className="mb-8 inline-flex items-center gap-3 text-4xl font-black">
            <BarChart3 className="h-9 w-9" strokeWidth={1.75} />
            Leaderboard
          </h2>
          <div className="w-full max-w-2xl space-y-2.5">
            {view.leaderboard.slice(0, 8).map((row, i) => (
              <div
                key={row.id}
                className="flex animate-slide-up items-center gap-4 rounded-2xl bg-white/10 px-5 py-3.5 ring-1 ring-white/15"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="flex w-9 justify-center text-2xl font-black">
                  <RankMedal place={row.rank} size="sm" showBadge />
                </span>
                <span className="text-3xl">{row.emoji}</span>
                <span className="min-w-0 flex-1 truncate text-lg font-bold">{row.name}</span>
                <span className="font-mono text-xl font-black">{fmtNumber(row.score)}</span>
                <span
                  className={cn(
                    "w-12 text-right text-sm font-bold",
                    row.delta > 0 ? "text-emerald-400" : row.delta < 0 ? "text-rose-400" : "text-slate-400"
                  )}
                >
                  {row.delta > 0 ? `↑${row.delta}` : row.delta < 0 ? `↓${-row.delta}` : "—"}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => post("next", { action: "next" })}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 text-lg font-bold transition hover:bg-emerald-400 active:scale-95"
          >
            {isLastQuestion ? (
              <>
                <Flag className="h-5 w-5" strokeWidth={1.75} />
                Yakuniy natijalar →
              </>
            ) : (
              "Keyingi savol →"
            )}
          </button>
        </div>
      )}

      {/* ============ PODIUM ============ */}
      {view.phase === "PODIUM" && view.podium && (
        <PodiumScreen view={view} onFinish={finish} />
      )}

      {/* ============ ENDED ============ */}
      {view.phase === "ENDED" && (
        <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6">
          <Flag className="h-16 w-16 text-cyan-400" strokeWidth={1.5} />
          <h2 className="text-3xl font-black">O&apos;yin yakunlandi</h2>
          {view.podium && view.podium.all.length > 0 && (
            <div className="w-full max-w-xl space-y-2">
              {view.podium.all.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/15"
                >
                  <span className="flex w-8 justify-center font-black">
                    <RankMedal place={p.place} size="sm" showBadge />
                  </span>
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                  <span className="font-mono font-bold">{fmtNumber(p.score)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => router.push("/teacher/quizzes")}
            className="rounded-xl bg-white/15 px-8 py-3 text-lg font-bold ring-1 ring-white/25 transition hover:bg-white/25"
          >
            ← Quizlarga qaytish
          </button>
        </div>
      )}

      {/* Erta yakunlash tugmasi (o'yin davomida) */}
      {(view.phase === "QUESTION" ||
        view.phase === "REVEAL" ||
        view.phase === "LEADERBOARD" ||
        view.phase === "LOBBY") && (
        <button
          onClick={() => {
            if (window.confirm("O'yinni hozir yakunlashga ishonchingiz komilmi?")) {
              if (view.phase === "LOBBY") {
                void finish();
              } else {
                void post("end");
              }
            }
          }}
          className="fixed bottom-4 right-4 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-indigo-300 ring-1 ring-white/10 transition hover:bg-rose-600/80 hover:text-white"
        >
          ✕ O&apos;yinni yakunlash
        </button>
      )}
    </div>
  );
}

// ---------------- Podium (bosqichma-bosqich ochiladi) ----------------

function PodiumScreen({ view, onFinish }: { view: HostView; onFinish: () => void }) {
  const [stage, setStage] = useState(1); // 1: 3-o'rin, 2: +2-o'rin, 3: +1-o'rin
  useEffect(() => {
    const t1 = setTimeout(() => setStage(2), 1000);
    const t2 = setTimeout(() => setStage(3), 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const podium = view.podium!;
  const byPlace = (place: number) => podium.top3.find((p) => p.place === place);
  const columns: Array<{ place: number; height: string; visibleAt: number; tone: string }> = [
    { place: 2, height: "h-40", visibleAt: 2, tone: "bg-slate-300/90 text-slate-100" },
    { place: 1, height: "h-56", visibleAt: 3, tone: "bg-amber-400/95 text-amber-950" },
    { place: 3, height: "h-32", visibleAt: 1, tone: "bg-orange-700/90 text-orange-50" },
  ];

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 bg-gradient-to-b from-violet-950 via-indigo-950 to-fuchsia-950 p-6 md:p-10">
      <h2 className="animate-bounce-in inline-flex items-center gap-3 text-center text-4xl font-black md:text-5xl">
        <PartyPopper className="h-10 w-10 text-amber-400" strokeWidth={1.5} />
        G&apos;oliblar podiumi
      </h2>

      <div className="flex w-full max-w-3xl items-end justify-center gap-3 md:gap-5">
        {columns.map((col) => {
          const p = byPlace(col.place);
          const visible = stage >= col.visibleAt;
          return (
            <div key={col.place} className="flex w-1/3 flex-col items-center gap-3">
              {p && visible && (
                <div className="animate-bounce-in text-center">
                  <div className="text-6xl">{p.emoji}</div>
                  <div className="mt-1 max-w-40 truncate text-lg font-black">{p.name}</div>
                  <div className="font-mono text-xl font-black text-amber-300">
                    {fmtNumber(p.score)}
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200">
                    <Check className="h-3 w-3" strokeWidth={2} />
                    {p.correct} ta to&apos;g&apos;ri javob
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "flex w-full items-start justify-center rounded-t-2xl pt-3 text-4xl shadow-2xl transition-all duration-700",
                  col.height,
                  visible && p ? col.tone : "bg-white/5 text-transparent"
                )}
              >
                {visible && p ? <RankMedal place={col.place} size="xl" /> : null}
              </div>
            </div>
          );
        })}
      </div>

      {stage >= 3 && (
        <div className="w-full max-w-2xl animate-slide-up space-y-2">
          {podium.all.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm ring-1 ring-white/15"
            >
              <span className="flex w-8 justify-center text-base font-black">
                <RankMedal place={p.place} size="sm" showBadge />
              </span>
              <span className="text-2xl">{p.emoji}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
                {p.correct}
              </span>
              <span className="inline-flex items-center gap-1 text-rose-300">
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                {p.wrong}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                {p.bestStreak}
              </span>
              <span className="w-20 text-right font-mono font-black">{fmtNumber(p.score)}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onFinish}
        className="rounded-2xl bg-emerald-500 px-10 py-3.5 text-xl font-black shadow-xl transition hover:bg-emerald-400 active:scale-95"
      >
        Yakunlash
      </button>
    </div>
  );
}
