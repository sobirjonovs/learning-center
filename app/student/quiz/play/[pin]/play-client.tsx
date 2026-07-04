"use client";

// O'quvchi o'yin ekrani — avatar tanlash, javob berish, natijalar (SSE)
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn, fmtNumber } from "@/lib/utils";
import { ANSWER_SHAPES, EMOJI_AVATARS } from "@/lib/constants";
import type { PlayerView } from "@/lib/quiz-live";

const MEDALS = ["🥇", "🥈", "🥉"];

export function PlayClient({ pin, quizName }: { pin: string; quizName: string }) {
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [view, setView] = useState<PlayerView | null>(null);
  const [connected, setConnected] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const offsetRef = useRef(0);

  // Avatar tanlab qo'shilish
  const joinGame = useCallback(
    async (emoji: string) => {
      if (joining) return;
      setJoining(true);
      setJoinError(null);
      try {
        const res = await fetch(`/api/quiz-live/${pin}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setJoinError(data?.error ?? "Qo'shilib bo'lmadi");
          return;
        }
        setMyEmoji(emoji);
        setJoined(true);
      } catch {
        setJoinError("Tarmoq xatosi. Qayta urinib ko'ring.");
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
        "fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 text-white",
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
          <div className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-300">
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

        <div className="grid max-w-md grid-cols-6 gap-2 sm:gap-3">
          {EMOJI_AVATARS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => joinGame(emoji)}
              disabled={joining}
              className="animate-pop rounded-2xl bg-white/10 p-3 text-4xl ring-1 ring-white/10 transition hover:scale-110 hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="text-sm text-indigo-300">Avatar ustiga bosing — darhol o&apos;yinga kirasiz</p>
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

  // ============ LOBBY ============
  if (view.phase === "LOBBY") {
    return shell(
      <div className="flex min-h-full flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="animate-float text-8xl">{view.me?.emoji ?? myEmoji ?? "🙂"}</div>
        <div>
          <h1 className="text-2xl font-black">Siz o&apos;yindasiz!</h1>
          <p className="mt-1 animate-pulse-soft text-sm text-indigo-300">
            O&apos;qituvchi boshlashini kuting...
          </p>
        </div>
        <div className="flex max-w-md flex-wrap justify-center gap-2">
          {view.lobbyPlayers.map((p, i) => (
            <span
              key={i}
              className="flex animate-bounce-in items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/10"
            >
              <span className="text-xl">{p.emoji}</span>
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
          <span className="text-3xl">{view.me?.emoji ?? myEmoji}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold">{view.me?.name}</span>
          {view.me && view.me.streak >= 2 && (
            <span className="animate-pop rounded-full bg-amber-500/25 px-2.5 py-1 text-sm font-black text-amber-300">
              🔥 x{view.me.streak}
            </span>
          )}
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-sm font-black">
            {fmtNumber(view.me?.score ?? 0)}
          </span>
        </div>

        {answered ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="animate-bounce-in text-6xl">✅</div>
            <h2 className="text-2xl font-black">Javobingiz qabul qilindi!</h2>
            <p className="animate-pulse-soft text-sm text-indigo-300">Boshqalarni kutamiz...</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-3 text-center text-sm font-semibold text-indigo-300">
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
        {!r || !r.answered ? (
          <div className="animate-bounce-in space-y-3">
            <div className="text-6xl">⏰</div>
            <h2 className="text-2xl font-black">Vaqt tugadi!</h2>
            <p className="text-sm text-indigo-300">Bu safar javob bera olmadingiz.</p>
            {r?.streakBroken && (
              <div className="text-lg font-bold text-rose-300">Streak uzildi 💔</div>
            )}
          </div>
        ) : r.correct ? (
          <div className="animate-bounce-in space-y-4">
            <div className="text-7xl">🎉</div>
            <h2 className="text-3xl font-black text-emerald-300">To&apos;g&apos;ri javob!</h2>
            <div className="text-5xl font-black text-amber-300">
              +{fmtNumber(r.delta)} <span className="text-2xl">ball</span>
            </div>
            <div className="mx-auto w-64 space-y-1.5 rounded-2xl bg-white/10 p-4 text-sm font-semibold ring-1 ring-white/15">
              <div className="flex justify-between">
                <span className="text-indigo-200">To&apos;g&apos;ri javob</span>
                <span>+{fmtNumber(r.breakdown.base)}</span>
              </div>
              {r.breakdown.speed > 0 && (
                <div className="flex justify-between">
                  <span className="text-indigo-200">⚡ Tezlik bonusi</span>
                  <span>+{fmtNumber(r.breakdown.speed)}</span>
                </div>
              )}
              {r.breakdown.streakBonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-indigo-200">🔥 {r.streak}x Streak</span>
                  <span>+{fmtNumber(r.breakdown.streakBonus)}</span>
                </div>
              )}
            </div>
            {r.streak >= 2 && (
              <div className="animate-pop text-xl font-black text-amber-300">
                🔥 {r.streak} ta ketma-ket!
              </div>
            )}
          </div>
        ) : (
          <div className="animate-bounce-in space-y-3">
            <div className="text-6xl">😔</div>
            <h2 className="text-2xl font-black">Bu safar noto&apos;g&apos;ri javob.</h2>
            <p className="text-sm text-indigo-300">Keyingi savolda omad!</p>
            {r.streakBroken && (
              <div className="text-lg font-bold text-rose-300">Streak uzildi 💔</div>
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
          <div className="w-full max-w-sm animate-bounce-in rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-center shadow-xl">
            <div className="text-3xl">{view.me?.emoji}</div>
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
              <span className="w-7 text-center text-base font-black">
                {row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}
              </span>
              <span className="text-2xl">{row.emoji}</span>
              <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
              <span className="font-mono font-black">{fmtNumber(row.score)}</span>
            </div>
          ))}
        </div>
        <p className="animate-pulse-soft text-sm text-indigo-300">Keyingi savolga tayyorlaning...</p>
      </div>
    );
  }

  // ============ PODIUM / YAKUN ============
  if (view.phase === "PODIUM" || view.phase === "ENDED") {
    const p = view.podium;
    if (!p) {
      return shell(
        <div className="flex min-h-full flex-col items-center justify-center gap-5 p-6 text-center">
          <div className="text-6xl">🏁</div>
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
        <div className="w-full max-w-sm animate-bounce-in rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-center shadow-2xl">
          <div className="text-5xl">{p.place && p.place <= 3 ? MEDALS[p.place - 1] : "🏆"}</div>
          <h1 className="mt-2 text-2xl font-black">
            {p.place ? `Siz ${p.place}-o'rinni egalladingiz!` : "O'yin yakunlandi!"}
          </h1>
          <div className="mt-2 font-mono text-4xl font-black text-amber-300">
            {fmtNumber(p.score)} <span className="text-lg">ball</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
            <div className="rounded-xl bg-white/15 px-3 py-2.5">
              ✅ {p.correct}/{view.total} to&apos;g&apos;ri
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2.5">
              🔥 Eng uzun streak: {p.bestStreak}
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2.5">
              ⚡ Eng tez:{" "}
              {p.fastestMs !== null ? `${(p.fastestMs / 1000).toFixed(1)} soniya` : "—"}
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2.5">❌ {p.wrong} xato</div>
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
            <div className="text-center text-xs font-bold uppercase tracking-wider text-indigo-300">
              G&apos;oliblar
            </div>
            {p.top3.map((t) => (
              <div
                key={t.place}
                className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2 text-sm ring-1 ring-white/10"
              >
                <span className="text-lg">{MEDALS[t.place - 1]}</span>
                <span className="text-2xl">{t.emoji}</span>
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
