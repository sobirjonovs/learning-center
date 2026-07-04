// Jonli quiz (Kahoot uslubida) — xotirada saqlanadigan o'yin dvigateli + SSE tarqatish.
// Holat globalThis da saqlanadi (dev rejimida HMR dan omon qoladi).
import { db } from "./db";
import { parseJsonArray } from "./utils";
import { awardScore, getQuizRates } from "./gamification";
import { logActivity } from "./log";

export type GamePhase = "LOBBY" | "QUESTION" | "REVEAL" | "LEADERBOARD" | "PODIUM" | "ENDED";

export type AnswerBreakdown = { base: number; speed: number; streakBonus: number };

export type PlayerAnswer = {
  qIndex: number;
  option: number; // -1 = javob bermadi
  ms: number;
  correct: boolean;
  delta: number;
  breakdown: AnswerBreakdown;
};

export type LastResult = {
  answered: boolean;
  correct: boolean;
  delta: number;
  breakdown: AnswerBreakdown;
  streak: number;
  streakBroken: boolean;
};

export type Player = {
  id: string;
  name: string;
  emoji: string;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  wrong: number;
  fastestMs: number | null; // eng tez to'g'ri javob
  kicked: boolean;
  answers: PlayerAnswer[];
  currentAnswer: { option: number; ms: number } | null;
  lastResult: LastResult | null;
  // persistResults to'ldiradi
  place: number | null;
  xpEarned: number;
  pointsEarned: number;
};

export type LiveQuestion = {
  text: string;
  image: string | null;
  options: string[];
  correctIndex: number;
  timeSeconds: number;
  points: number;
};

type Listener = (game: Game) => void;

export type Game = {
  pin: string;
  quizId: string;
  hostId: string;
  quiz: { name: string; image: string | null; countsToRating: boolean };
  questions: LiveQuestion[];
  phase: GamePhase;
  qIndex: number;
  questionStartedAt: number; // ms
  questionEndsAt: number; // ms
  timer: NodeJS.Timeout | null;
  players: Map<string, Player>;
  listeners: Set<Listener>;
  prevRanks: Map<string, number>; // oldingi savolgacha bo'lgan o'rinlar (↑↓ uchun)
  questionsPlayed: number;
  finished: boolean;
  persisted: boolean;
};

type Store = { games: Map<string, Game> };
const store: Store = ((globalThis as unknown as { __quizLive?: Store }).__quizLive ??= {
  games: new Map(),
});

const GAME_TTL_MS = 2 * 60 * 60 * 1000; // 2 soat

// ---------------- Yordamchilar ----------------

function activePlayers(game: Game): Player[] {
  return [...game.players.values()].filter((p) => !p.kicked);
}

/** Ball bo'yicha kamayish tartibida (teng bo'lsa ism bo'yicha) */
function rankPlayers(game: Game): Player[] {
  return activePlayers(game).sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );
}

function broadcast(game: Game): void {
  for (const listener of game.listeners) {
    try {
      listener(game);
    } catch {
      // bitta tinglovchi xatosi boshqalarga xalaqit bermaydi
    }
  }
}

// ---------------- O'yin hayoti ----------------

/** Quizni bazadan yuklab, yangi jonli o'yin ochadi va PIN qaytaradi. */
export async function createGame(quizId: string, hostId: string): Promise<string> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) throw new Error("Quiz topilmadi");
  if (quiz.questions.length === 0) throw new Error("Quizda kamida bitta savol bo'lishi kerak");

  let pin: string;
  do {
    pin = String(Math.floor(100000 + Math.random() * 900000));
  } while (store.games.has(pin));

  const game: Game = {
    pin,
    quizId,
    hostId,
    quiz: { name: quiz.name, image: quiz.image, countsToRating: quiz.countsToRating },
    questions: quiz.questions.map((q) => ({
      text: q.text,
      image: q.image,
      options: parseJsonArray<string>(q.options),
      correctIndex: q.correctIndex,
      timeSeconds: q.timeSeconds,
      points: q.points,
    })),
    phase: "LOBBY",
    qIndex: 0,
    questionStartedAt: 0,
    questionEndsAt: 0,
    timer: null,
    players: new Map(),
    listeners: new Set(),
    prevRanks: new Map(),
    questionsPlayed: 0,
    finished: false,
    persisted: false,
  };
  store.games.set(pin, game);

  // 2 soatdan keyin avtomatik tozalash
  setTimeout(() => {
    const g = store.games.get(pin);
    if (g === game) {
      if (g.timer) clearTimeout(g.timer);
      store.games.delete(pin);
    }
  }, GAME_TTL_MS);

  return pin;
}

export function getGame(pin: string): Game | undefined {
  return store.games.get(pin);
}

/** O'quvchi o'yinga qo'shiladi (faqat LOBBY; mavjud o'yinchi qayta ulanishi mumkin). */
export function join(
  pin: string,
  user: { id: string; name: string },
  emoji: string
): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };

  const existing = game.players.get(user.id);
  if (existing) {
    if (existing.kicked) return { error: "Siz o'yindan chiqarilgansiz" };
    // qayta ulanish — avatarni yangilaymiz
    existing.emoji = emoji;
    existing.name = user.name;
    broadcast(game);
    return {};
  }

  if (game.phase !== "LOBBY") return { error: "O'yin allaqachon boshlangan" };

  game.players.set(user.id, {
    id: user.id,
    name: user.name,
    emoji,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    fastestMs: null,
    kicked: false,
    answers: [],
    currentAnswer: null,
    lastResult: null,
    place: null,
    xpEarned: 0,
    pointsEarned: 0,
  });
  broadcast(game);
  return {};
}

/** O'quvchini o'yindan chiqarish (faqat host). */
export function kick(pin: string, hostId: string, studentId: string): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.hostId !== hostId) return { error: "Ruxsat yo'q" };
  const player = game.players.get(studentId);
  if (!player) return { error: "O'quvchi topilmadi" };
  player.kicked = true;

  // qolganlarning hammasi javob bergan bo'lsa — savolni erta yopamiz
  const active = activePlayers(game);
  if (game.phase === "QUESTION" && active.length > 0 && active.every((p) => p.currentAnswer)) {
    closeQuestion(game);
  } else {
    broadcast(game);
  }
  return {};
}

/** O'yinni boshlash (LOBBY → birinchi savol). */
export function start(pin: string, hostId: string): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.hostId !== hostId) return { error: "Ruxsat yo'q" };
  if (game.phase !== "LOBBY") return { error: "O'yin allaqachon boshlangan" };
  if (activePlayers(game).length === 0) return { error: "Hali hech kim qo'shilmadi" };
  game.phase = "QUESTION";
  game.qIndex = 0;
  beginQuestion(game);
  return {};
}

function beginQuestion(game: Game): void {
  const q = game.questions[game.qIndex];
  for (const p of game.players.values()) {
    p.currentAnswer = null;
    p.lastResult = null;
  }
  game.questionStartedAt = Date.now();
  game.questionEndsAt = game.questionStartedAt + q.timeSeconds * 1000;
  if (game.timer) clearTimeout(game.timer);
  game.timer = setTimeout(() => closeQuestion(game), q.timeSeconds * 1000);
  broadcast(game);
}

/** O'quvchi javobi. Hamma javob bersa — savol erta yopiladi. */
export function answer(pin: string, studentId: string, option: number): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.phase !== "QUESTION") return { error: "Hozir javob qabul qilinmaydi" };
  const player = game.players.get(studentId);
  if (!player || player.kicked) return { error: "Siz bu o'yinda emassiz" };
  if (player.currentAnswer) return { error: "Javob allaqachon yuborilgan" };

  const q = game.questions[game.qIndex];
  if (!Number.isInteger(option) || option < 0 || option >= q.options.length) {
    return { error: "Noto'g'ri variant" };
  }

  player.currentAnswer = { option, ms: Math.max(0, Date.now() - game.questionStartedAt) };

  const active = activePlayers(game);
  if (active.length > 0 && active.every((p) => p.currentAnswer)) {
    closeQuestion(game); // hamma javob berdi — erta yakunlaymiz
  } else {
    broadcast(game);
  }
  return {};
}

/** Savolni yopish va ballarni hisoblash. */
function closeQuestion(game: Game): void {
  if (game.phase !== "QUESTION") return;
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  const q = game.questions[game.qIndex];

  // ↑↓ hisoblash uchun ballar yangilanishidan OLDINGI o'rinlarni saqlaymiz
  game.prevRanks = new Map(rankPlayers(game).map((p, i) => [p.id, i + 1]));

  for (const p of game.players.values()) {
    if (p.kicked) continue;
    const ans = p.currentAnswer;
    const answered = ans !== null;
    const correct = answered && ans!.option === q.correctIndex;
    const breakdown: AnswerBreakdown = { base: 0, speed: 0, streakBonus: 0 };
    let delta = 0;
    let streakBroken = false;

    if (correct) {
      breakdown.base = q.points;
      const remainingFrac = Math.max(0, 1 - ans!.ms / (q.timeSeconds * 1000));
      breakdown.speed = Math.round(q.points * 0.5 * remainingFrac);
      p.streak += 1;
      breakdown.streakBonus = p.streak >= 2 ? Math.min(100 * (p.streak - 1), 500) : 0;
      delta = breakdown.base + breakdown.speed + breakdown.streakBonus;
      p.score += delta;
      p.correct += 1;
      p.bestStreak = Math.max(p.bestStreak, p.streak);
      if (p.fastestMs === null || ans!.ms < p.fastestMs) p.fastestMs = ans!.ms;
    } else {
      streakBroken = p.streak >= 2;
      p.streak = 0;
      p.wrong += 1;
    }

    p.answers.push({
      qIndex: game.qIndex,
      option: answered ? ans!.option : -1,
      ms: answered ? ans!.ms : q.timeSeconds * 1000,
      correct,
      delta,
      breakdown,
    });
    p.lastResult = { answered, correct, delta, breakdown, streak: p.streak, streakBroken };
  }

  game.questionsPlayed += 1;
  game.phase = "REVEAL";
  broadcast(game);
}

/** REVEAL → LEADERBOARD (faqat host). */
export function showLeaderboard(pin: string, hostId: string): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.hostId !== hostId) return { error: "Ruxsat yo'q" };
  if (game.phase !== "REVEAL") return { error: "Hozir leaderboard ko'rsatib bo'lmaydi" };
  game.phase = "LEADERBOARD";
  broadcast(game);
  return {};
}

/** Keyingi savol yoki podium (faqat host). */
export function next(pin: string, hostId: string): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.hostId !== hostId) return { error: "Ruxsat yo'q" };
  if (game.phase !== "REVEAL" && game.phase !== "LEADERBOARD") {
    return { error: "Hozir keyingi bosqichga o'tib bo'lmaydi" };
  }
  if (game.qIndex + 1 < game.questions.length) {
    game.qIndex += 1;
    game.phase = "QUESTION";
    beginQuestion(game);
  } else {
    game.finished = true;
    game.phase = "PODIUM";
    broadcast(game);
    void persistResults(game)
      .then(() => broadcast(game)) // XP/ball qiymatlari bilan yangilaymiz
      .catch(() => {});
  }
  return {};
}

/** O'yinni yakunlash (erta to'xtatish ham mumkin). */
export function endGame(pin: string, hostId: string): { error?: string } {
  const game = store.games.get(pin);
  if (!game) return { error: "O'yin topilmadi" };
  if (game.hostId !== hostId) return { error: "Ruxsat yo'q" };
  if (game.timer) {
    clearTimeout(game.timer);
    game.timer = null;
  }
  game.finished = true;
  game.phase = "ENDED";
  broadcast(game);
  // kamida bitta savol o'ynalgan bo'lsa — natijalarni saqlaymiz
  if (game.questionsPlayed > 0 && !game.persisted) {
    void persistResults(game)
      .then(() => broadcast(game))
      .catch(() => {});
  }
  return {};
}

/** Natijalarni bazaga yozish va (reytingga kirsa) XP/ball berish. Bir marta ishlaydi. */
async function persistResults(game: Game): Promise<void> {
  if (game.persisted) return;
  game.persisted = true;

  const ranked = rankPlayers(game);
  let xpRate = 0;
  let pointRate = 0;
  if (game.quiz.countsToRating) {
    const rates = await getQuizRates();
    xpRate = rates.xpRate;
    pointRate = rates.pointRate;
  }

  for (let i = 0; i < ranked.length; i++) {
    const p = ranked[i];
    const place = i + 1;
    const xpEarned = game.quiz.countsToRating ? Math.round(p.score * xpRate) : 0;
    const pointsEarned = game.quiz.countsToRating ? Math.round(p.score * pointRate) : 0;
    p.place = place;
    p.xpEarned = xpEarned;
    p.pointsEarned = pointsEarned;
    try {
      await db.quizResult.create({
        data: {
          quizId: game.quizId,
          studentId: p.id,
          pin: game.pin,
          score: p.score,
          correctCount: p.correct,
          wrongCount: p.wrong,
          bestStreak: p.bestStreak,
          fastestMs: p.fastestMs,
          place,
          xpEarned,
          pointsEarned,
        },
      });
      if (game.quiz.countsToRating && (xpEarned > 0 || pointsEarned > 0)) {
        await awardScore(p.id, {
          xp: xpEarned,
          points: pointsEarned,
          reason: `Quiz: ${game.quiz.name} (${place}-o'rin)`,
          sourceType: "QUIZ",
          sourceId: game.quizId,
        });
      }
    } catch {
      // bitta o'quvchining xatosi qolganlarga xalaqit bermaydi
    }
  }

  await logActivity(game.hostId, "Quiz o'tkazdi", game.quiz.name);
}

// ---------------- Obuna ----------------

/** Tinglovchini qo'shadi; bekor qilish funksiyasini qaytaradi. */
export function subscribe(pin: string, listener: Listener): () => void {
  const game = store.games.get(pin);
  if (!game) return () => {};
  game.listeners.add(listener);
  return () => {
    game.listeners.delete(listener);
  };
}

// ---------------- Ko'rinishlar (view) ----------------

/** Host (o'qituvchi ekrani) uchun to'liq ko'rinish. */
export function hostView(game: Game) {
  const q = game.questions[game.qIndex];
  const active = activePlayers(game);
  const ranked = rankPlayers(game);
  const showQuestion = game.phase === "QUESTION" || game.phase === "REVEAL";
  const showPodium = game.phase === "PODIUM" || game.phase === "ENDED";

  return {
    role: "host" as const,
    now: Date.now(),
    pin: game.pin,
    phase: game.phase,
    qIndex: game.qIndex,
    total: game.questions.length,
    quiz: { name: game.quiz.name, image: game.quiz.image },
    playerCount: active.length,
    answeredCount: active.filter((p) => p.currentAnswer).length,
    players: [...game.players.values()]
      .filter((p) => !p.kicked)
      .map((p) => ({ id: p.id, name: p.name, emoji: p.emoji, score: p.score })),
    question: showQuestion
      ? {
          text: q.text,
          image: q.image,
          options: q.options,
          timeSeconds: q.timeSeconds,
          points: q.points,
          correctIndex: game.phase === "REVEAL" ? q.correctIndex : null,
        }
      : null,
    questionStartedAt: game.questionStartedAt,
    questionEndsAt: game.questionEndsAt,
    reveal:
      game.phase === "REVEAL"
        ? {
            counts: q.options.map(
              (_, i) => active.filter((p) => p.currentAnswer?.option === i).length
            ),
            noAnswer: active.filter((p) => !p.currentAnswer).length,
            fastest: active
              .filter((p) => p.currentAnswer && p.currentAnswer.option === q.correctIndex)
              .sort((a, b) => a.currentAnswer!.ms - b.currentAnswer!.ms)
              .slice(0, 3)
              .map((p) => ({ name: p.name, emoji: p.emoji, ms: p.currentAnswer!.ms })),
          }
        : null,
    leaderboard: ranked.map((p, i) => {
      const prev = game.prevRanks.get(p.id);
      return {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        score: p.score,
        rank: i + 1,
        delta: prev !== undefined ? prev - (i + 1) : 0,
      };
    }),
    podium: showPodium
      ? {
          top3: ranked.slice(0, 3).map((p, i) => ({
            name: p.name,
            emoji: p.emoji,
            score: p.score,
            correct: p.correct,
            place: i + 1,
          })),
          all: ranked.map((p, i) => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            score: p.score,
            correct: p.correct,
            wrong: p.wrong,
            bestStreak: p.bestStreak,
            place: i + 1,
          })),
        }
      : null,
    finished: game.finished,
  };
}

export type HostView = ReturnType<typeof hostView>;

/** O'quvchi qurilmasi uchun cheklangan ko'rinish (to'g'ri javob oshkor qilinmaydi). */
export function playerView(game: Game, studentId: string) {
  const q = game.questions[game.qIndex];
  const ranked = rankPlayers(game);
  const me = game.players.get(studentId) ?? null;
  const myRank = me && !me.kicked ? ranked.findIndex((p) => p.id === studentId) + 1 : 0;
  const showPodium = game.phase === "PODIUM" || game.phase === "ENDED";

  return {
    role: "player" as const,
    now: Date.now(),
    pin: game.pin,
    phase: game.phase,
    qIndex: game.qIndex,
    total: game.questions.length,
    quizName: game.quiz.name,
    optionCount: q.options.length,
    questionStartedAt: game.questionStartedAt,
    questionEndsAt: game.questionEndsAt,
    joined: me !== null,
    kicked: me?.kicked ?? false,
    answered: me?.currentAnswer !== null && me?.currentAnswer !== undefined,
    me: me
      ? { name: me.name, emoji: me.emoji, score: me.score, streak: me.streak, rank: myRank }
      : null,
    lobbyPlayers: activePlayers(game).map((p) => ({ name: p.name, emoji: p.emoji })),
    reveal: game.phase === "REVEAL" && me ? me.lastResult : null,
    leaderboard:
      game.phase === "LEADERBOARD"
        ? {
            top: ranked.slice(0, 5).map((p, i) => ({
              name: p.name,
              emoji: p.emoji,
              score: p.score,
              rank: i + 1,
              isMe: p.id === studentId,
            })),
            own: me && !me.kicked ? { rank: myRank, score: me.score } : null,
          }
        : null,
    podium:
      showPodium && me
        ? {
            place: me.place ?? (myRank || null),
            score: me.score,
            correct: me.correct,
            wrong: me.wrong,
            bestStreak: me.bestStreak,
            fastestMs: me.fastestMs,
            xpEarned: me.xpEarned,
            pointsEarned: me.pointsEarned,
            countsToRating: game.quiz.countsToRating,
            persisted: game.persisted,
            top3: ranked.slice(0, 3).map((p, i) => ({
              name: p.name,
              emoji: p.emoji,
              score: p.score,
              place: i + 1,
            })),
          }
        : null,
  };
}

export type PlayerView = ReturnType<typeof playerView>;
