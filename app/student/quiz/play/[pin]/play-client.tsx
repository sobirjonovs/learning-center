"use client";

// O'quvchi o'yin ekrani — avatar tanlash, javob berish, natijalar (SSE)
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn, fmtNumber } from "@/lib/utils";
import { ANSWER_SHAPES, QUIZ_AVATAR_IDS } from "@/lib/constants";
import { DEFAULT_QUIZ_AVATAR, resolveQuizExpression, toSelectableAvatarId } from "@/lib/quiz-avatars";
import type { PlayerView } from "@/lib/quiz-live";
import { QuizAvatar } from "@/components/quiz-avatar";
import { requestFullscreen } from "@/lib/fullscreen";
import { useQuizImmersive } from "@/lib/use-quiz-immersive";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flag,
  Flame,
  HeartCrack,
  PartyPopper,
  X,
  Zap,
} from "lucide-react";
import { RankMedal } from "@/components/rank-medal";

export function PlayClient({ pin, quizName }: { pin: string; quizName: string }) {
  const [joined, setJoined] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [myAvatar, setMyAvatar] = useState<string | null>(null);
  const [view, setView] = useState<PlayerView | null>(null);
  const [connected, setConnected] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const offsetRef = useRef(0);

  // Avatar tanlab qo'shilish
  const joinGame = useCallback(
    async (avatar: string) => {
      if (joining) return;
      setJoining(true);
      setJoinError(null);
      try {
        const res = await fetch(`/api/quiz-live/${pin}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setJoinError(data?.error ?? "Qo'shilib bo'lmadi");
          setImmersive(false);
          return;
        }
        setMyAvatar(avatar);
        setJoined(true);
      } catch {
        setJoinError("Tarmoq xatosi. Qayta urinib ko'ring.");
        setImmersive(false);
      } finally {
        setJoining(false);
      }
    },
    [pin, joining]
  );

  // SSE ulanishi (qo'shilgandan keyin)
  useEffect(() => {
    if (!joined) return;
    const es = new EventSource(`/api/quiz-live/${pin}/stream`);
    es.onmessage = (e) => {
      try {
        const v = JSON.parse(e.data) as PlayerView;
        offsetRef.current = v.now - Date.now();
        setView(v);
        setConnected(true);
      } catch {
        // e'tiborsiz
      }
    };
    es.onerror = () => setConnected(false);
    es.onopen = () => setConnected(true);
    return () => es.close();
  }, [joined, pin]);

  // Yangi savolda tanlovni tozalash
  useEffect(() => {
    setSelected(null);
  }, [view?.qIndex]);

  // Sanoq chizig'i uchun soat
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useQuizImmersive(immersive || joined);

  const sendAnswer = useCallback(
    (option: number) => {
      if (selected !== null) return;
      setSelected(option);
      fetch(`/api/quiz-live/${pin}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option }),
      }).catch(() => {});
    },
    [pin, selected]
  );

  const shell = (children: React.ReactNode, extraCls?: string) => (
    <div
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto app-canvas text-white",
        extraCls
      )}
    >
      {!connected && joined && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 animate-pulse-soft whitespace-nowrap rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold shadow-lg">
          Ulanish uzildi, qayta ulanilmoqda...
        </div>
      )}
      {children}
    </div>
  );

  // ============ CHIQARILGAN ============
  if (view?.kicked) {
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-5 p-6 text-center">
        <div className="text-6xl">🚫</div>
        <h1 className="text-2xl font-black">Siz o&apos;yindan chiqarildingiz</h1>
        <Link
          href="/student/quiz"
          className="rounded-xl bg-white/15 px-6 py-3 font-bold ring-1 ring-white/25 transition hover:bg-white/25"
        >
          ← Orqaga qaytish
        </Link>
      </div>
    );
  }

  // ============ AVATAR TANLASH ============
  if (!joined) {
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-5">
        <div className="text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            {quizName}
          </div>
          <h1 className="mt-1 text-2xl font-black md:text-3xl">O&apos;zingizga avatar tanlang</h1>
        </div>

        {joinError && (
          <div className="animate-shake rounded-xl bg-rose-600/80 px-4 py-2.5 text-center text-sm font-semibold">
            {joinError}
            <div className="mt-1">
              <Link href="/student/quiz" className="underline">
                ← Orqaga qaytish
              </Link>
            </div>
          </div>
        )}

        <div className="grid max-w-2xl grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6">
          {QUIZ_AVATAR_IDS.map((avatarId) => {
            const selectId = toSelectableAvatarId(avatarId);
            return (
              <button
                key={avatarId}
                onClick={() => {
                  setImmersive(true);
                  void requestFullscreen().catch(() => {});
                  void joinGame(selectId);
                }}
                disabled={joining}
                className="animate-pop flex aspect-square items-center justify-center rounded-2xl bg-white/10 p-2 ring-1 ring-white/10 transition hover:scale-110 hover:bg-white/20 active:scale-95 disabled:opacity-50"
              >
                <QuizAvatar id={selectId} size="xl" />
              </button>
            );
          })}
        </div>
        <p className="text-sm text-blue-300">Avatar ustiga bosing — darhol o&apos;yinga kirasiz</p>
      </div>
    );
  }

  if (!view) {
    return shell(
      <div className="flex min-h-full items-center justify-center">
        <div className="animate-pulse-soft text-lg font-semibold">Ulanmoqda...</div>
      </div>
    );
  }

  const serverNow = nowTick + offsetRef.current;
  const totalQMs = Math.max(1, view.questionEndsAt - view.questionStartedAt);
  const remainFrac = Math.min(1, Math.max(0, (view.questionEndsAt - serverNow) / totalQMs));
  const answered = view.answered || selected !== null;
  const myAvatarId = view.me?.emoji ?? myAvatar ?? DEFAULT_QUIZ_AVATAR;
  const myExpression = resolveQuizExpression(view.phase, view.reveal);

  // ============ LOBBY ============
  if (view.phase === "LOBBY") {
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="animate-float">
          <QuizAvatar id={myAvatarId} expression={myExpression} size="3xl" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Siz o&apos;yindasiz!</h1>
          <p className="mt-1 animate-pulse-soft text-sm text-blue-300">
            O&apos;qituvchi boshlashini kuting...
          </p>
        </div>
        <div className="flex max-w-md flex-wrap justify-center gap-2">
          {view.lobbyPlayers.map((p, i) => (
            <span
              key={i}
              className="flex animate-bounce-in items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/10"
            >
              <QuizAvatar id={p.emoji} expression={resolveQuizExpression(view.phase)} size="sm" />
              {p.name}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ============ SAVOL ============
  if (view.phase === "QUESTION") {
    return shell(
      <div className="flex min-h-full flex-col">
        {/* Sanoq chizig'i */}
        <div className="h-1.5 w-full bg-white/10">
          <div
            className="h-full bg-amber-400 transition-all duration-300"
            style={{ width: `${remainFrac * 100}%` }}
          />
        </div>

        {/* Mini panel */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <QuizAvatar id={myAvatarId} expression={myExpression} size="lg" />
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{view.me?.name}</span>
          {view.me && view.me.streak >= 2 && (
            <span className="animate-pop inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2.5 py-1 text-sm font-black text-amber-300">
              <Flame className="h-4 w-4" strokeWidth={2} />
              x{view.me.streak}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm font-black">
            {fmtNumber(view.me?.score ?? 0)}
          </span>
        </div>

        {answered ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <CheckCircle2 className="h-16 w-16 animate-bounce-in text-emerald-400" strokeWidth={1.5} />
            <h2 className="text-2xl font-black">Javobingiz qabul qilindi!</h2>
            <p className="animate-pulse-soft text-sm text-blue-300">Boshqalarni kutamiz...</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-3 text-center text-sm font-semibold text-blue-300">
              Savol {view.qIndex + 1} / {view.total} — ekranga qarab variantni tanlang!
            </div>
            <div
              className={cn(
                "grid flex-1 content-center gap-4",
                view.optionCount === 2 ? "grid-cols-1" : "grid-cols-2"
              )}
            >
              {ANSWER_SHAPES.slice(0, view.optionCount).map((s, i) => (
                <button
                  key={s.letter}
                  onClick={() => sendAnswer(i)}
                  className={cn(
                    "flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl text-white shadow-xl transition active:scale-95 md:min-h-36",
                    s.bg,
                    s.hover
                  )}
                >
                  <span className="text-4xl drop-shadow">{s.shape}</span>
                  <span className="text-2xl font-black">{s.letter}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ NATIJA (REVEAL) ============
  if (view.phase === "REVEAL") {
    const r = view.reveal;
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <QuizAvatar id={myAvatarId} expression={myExpression} size="3xl" />
        {!r || !r.answered ? (
          <div className="animate-bounce-in space-y-3">
            <Clock className="h-16 w-16 text-amber-400" strokeWidth={1.5} />
            <h2 className="text-2xl font-black">Vaqt tugadi!</h2>
            <p className="text-sm text-blue-300">Bu safar javob bera olmadingiz.</p>
            {r?.streakBroken && (
              <span className="inline-flex items-center gap-1 text-lg font-bold text-rose-300">
                <HeartCrack className="h-5 w-5" strokeWidth={1.75} />
                Streak uzildi
              </span>
            )}
          </div>
        ) : r.correct ? (
          <div className="animate-bounce-in space-y-4">
            <PartyPopper className="h-16 w-16 text-emerald-400" strokeWidth={1.5} />
            <h2 className="text-3xl font-black text-emerald-300">To&apos;g&apos;ri javob!</h2>
            <div className="text-5xl font-black text-amber-300">
              +{fmtNumber(r.delta)} <span className="text-2xl">ball</span>
            </div>
            <div className="mx-auto w-64 space-y-1.5 rounded-2xl bg-white/10 p-4 text-sm font-semibold ring-1 ring-white/15">
              <div className="flex justify-between">
                <span className="text-blue-200">To&apos;g&apos;ri javob</span>
                <span>+{fmtNumber(r.breakdown.base)}</span>
              </div>
              {r.breakdown.speed > 0 && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-blue-200">
                    <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Tezlik bonusi
                  </span>
                  <span>+{fmtNumber(r.breakdown.speed)}</span>
                </div>
              )}
              {r.breakdown.streakBonus > 0 && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-blue-200">
                    <Flame className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {r.streak}x Streak
                  </span>
                  <span>+{fmtNumber(r.breakdown.streakBonus)}</span>
                </div>
              )}
            </div>
            {r.streak >= 2 && (
              <div className="animate-pop inline-flex items-center gap-1.5 text-xl font-black text-amber-300">
                <Flame className="h-5 w-5" strokeWidth={1.75} />
                {r.streak} ta ketma-ket!
              </div>
            )}
          </div>
        ) : (
          <div className="animate-bounce-in space-y-3">
            <AlertCircle className="h-16 w-16 text-slate-400" strokeWidth={1.5} />
            <h2 className="text-2xl font-black">Bu safar noto&apos;g&apos;ri javob.</h2>
            {r.delta < 0 ? (
              <div className="text-4xl font-black text-rose-400">
                {fmtNumber(r.delta)} <span className="text-2xl">ball</span>
              </div>
            ) : (
              <p className="text-sm text-blue-300">Keyingi savolda omad!</p>
            )}
            {r.breakdown.penalty > 0 && (
              <div className="mx-auto w-64 rounded-2xl bg-white/10 p-4 text-sm font-semibold ring-1 ring-white/15">
                <div className="flex justify-between text-rose-300">
                  <span>Noto&apos;g&apos;ri javob jarimasi</span>
                  <span>−{fmtNumber(r.breakdown.penalty)}</span>
                </div>
              </div>
            )}
            {r.streakBroken && (
              <span className="inline-flex items-center gap-1 text-lg font-bold text-rose-300">
                <HeartCrack className="h-5 w-5" strokeWidth={1.75} />
                Streak uzildi
              </span>
            )}
          </div>
        )}
        <div className="mt-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold">
          Jami: {fmtNumber(view.me?.score ?? 0)} ball
        </div>
      </div>
    );
  }

  // ============ LEADERBOARD ============
  if (view.phase === "LEADERBOARD" && view.leaderboard) {
    const lb = view.leaderboard;
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-5 p-6">
        {lb.own && (
          <div className="w-full max-w-sm animate-bounce-in rounded-2xl bg-gradient-to-r from-blue-800 to-blue-500 p-5 text-center shadow-xl shadow-blue-600/30">
            <QuizAvatar id={myAvatarId} expression={myExpression} size="lg" />
            <div className="mt-1 text-xl font-black">
              Siz {lb.own.rank}-o&apos;rindasiz — {fmtNumber(lb.own.score)} ball
            </div>
          </div>
        )}
        <div className="w-full max-w-sm space-y-2">
          {lb.top.map((row, i) => (
            <div
              key={i}
              className={cn(
                "flex animate-slide-up items-center gap-3 rounded-xl px-4 py-2.5 text-sm ring-1",
                row.isMe ? "bg-white/20 ring-white/40" : "bg-white/10 ring-white/10"
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
                <span className="flex w-7 justify-center text-base font-black">
                  <RankMedal place={row.rank} size="sm" showBadge />
                </span>
              <QuizAvatar id={row.emoji} expression={resolveQuizExpression(view.phase)} size="md" />
              <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
              <span className="font-mono font-black">{fmtNumber(row.score)}</span>
            </div>
          ))}
        </div>
        <p className="animate-pulse-soft text-sm text-blue-300">Keyingi savolga tayyorlaning...</p>
      </div>
    );
  }

  // ============ PODIUM / YAKUN ============
  if (view.phase === "PODIUM" || view.phase === "ENDED") {
    const p = view.podium;
    if (!p) {
      return shell(
        <div className="flex min-h-full flex-col items-center justify-center gap-5 p-6 text-center">
          <Flag className="h-16 w-16 text-cyan-400" strokeWidth={1.5} />
          <h1 className="text-2xl font-black">O&apos;yin yakunlandi</h1>
          <Link
            href="/student/quiz"
            className="rounded-xl bg-white/15 px-6 py-3 font-bold ring-1 ring-white/25 transition hover:bg-white/25"
          >
            Chiqish
          </Link>
        </div>
      );
    }
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-5 p-6">
        <div className="w-full max-w-sm animate-bounce-in rounded-3xl bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-600 p-6 text-center shadow-2xl shadow-blue-600/30">
          <div className="mb-3 flex justify-center">
            <QuizAvatar id={myAvatarId} expression="happy-face" size="3xl" />
          </div>
          <div className="flex justify-center">
            {p.place ? (
              <RankMedal place={p.place} size="xl" />
            ) : (
              <Flag className="h-10 w-10 text-cyan-400" strokeWidth={1.5} />
            )}
          </div>
          <h1 className="mt-2 text-2xl font-black">
            {p.place ? `Siz ${p.place}-o'rinni egalladingiz!` : "O'yin yakunlandi!"}
          </h1>
          <div className="mt-2 font-mono text-4xl font-black text-amber-300">
            {fmtNumber(p.score)} <span className="text-lg">ball</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
              {p.correct}/{view.total} to&apos;g&apos;ri
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2.5">
              <Flame className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
              Eng uzun streak: {p.bestStreak}
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2.5">
              <Zap className="h-4 w-4 text-cyan-400" strokeWidth={1.75} />
              Eng tez:{" "}
              {p.fastestMs !== null ? `${(p.fastestMs / 1000).toFixed(1)} soniya` : "—"}
            </div>
            <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-3 py-2.5">
              <X className="h-4 w-4 text-rose-400" strokeWidth={1.75} />
              {p.wrong} xato
            </div>
          </div>

          {p.countsToRating && (
            <div className="mt-3 flex justify-center gap-2 text-sm font-black">
              {p.persisted ? (
                <>
                  <span className="rounded-full bg-emerald-500/90 px-3.5 py-1.5">
                    +{fmtNumber(p.xpEarned)} XP
                  </span>
                  <span className="rounded-full bg-amber-500/90 px-3.5 py-1.5">
                    +{fmtNumber(p.pointsEarned)} bonus ball
                  </span>
                </>
              ) : (
                <span className="animate-pulse-soft rounded-full bg-white/15 px-3.5 py-1.5">
                  XP hisoblanmoqda...
                </span>
              )}
            </div>
          )}
        </div>

        {p.top3.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <div className="text-center text-xs font-bold uppercase tracking-wider text-blue-300">
              G&apos;oliblar
            </div>
            {p.top3.map((t) => (
              <div
                key={t.place}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
              >
                <span className="flex w-7 justify-center">
                  <RankMedal place={t.place} size="sm" showBadge />
                </span>
                <QuizAvatar id={t.emoji} expression="happy-face" size="md" />
                <span className="min-w-0 flex-1 truncate font-semibold">{t.name}</span>
                <span className="font-mono font-black">{fmtNumber(t.score)}</span>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/student/quiz"
          className="rounded-xl bg-white/15 px-8 py-3 font-bold ring-1 ring-white/25 transition hover:bg-white/25"
        >
          Chiqish
        </Link>
      </div>
    );
  }

  // Zaxira holat
  return shell(
    <div className="flex min-h-full items-center justify-center">
      <div className="animate-pulse-soft text-lg font-semibold">Kutilmoqda...</div>
    </div>
  );
}
