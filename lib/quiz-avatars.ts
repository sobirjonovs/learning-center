/** Quiz Battle avatar — tana tanlanadi, yuz ifodasi o'yin holatiga qarab o'zgaradi */

export const QUIZ_FACE_IDS = ["happy-face", "sad-face", "satisfied-face"] as const;
export type QuizFaceId = (typeof QUIZ_FACE_IDS)[number];

export type QuizGamePhase =
  | "LOBBY"
  | "QUESTION"
  | "REVEAL"
  | "LEADERBOARD"
  | "PODIUM"
  | "ENDED";

export const QUIZ_BODY_IDS = [
  "sun",
  "owl",
  "chick",
  "turkey",
  "penguin",
  "brain",
  "skull",
  "world",
  "mole",
  "mouse",
  "rabbit",
  "scarecrow",
  "zombie",
  "deer",
  "cat",
  "dog",
] as const;
export type QuizBodyId = (typeof QUIZ_BODY_IDS)[number];

/** Og'iz/tish uslubi — tana bo'yicha */
export type MouthStyle =
  | "open-tongue" // tishsiz, ochiq og'iz + til
  | "rodent" // oldinda 2 ta old tish (kemiruvchi)
  | "none" // og'iz yo'q
  | "fang" // ikki yonda uchbur tish (mushuk)
  | "full-teeth"; // to'liq tishli (kuchuk)

/** Tana → og'iz uslubi */
export const QUIZ_BODY_MOUTH: Record<QuizBodyId, MouthStyle> = {
  sun: "open-tongue",
  owl: "open-tongue",
  chick: "open-tongue",
  turkey: "open-tongue",
  penguin: "open-tongue",
  brain: "open-tongue",
  skull: "open-tongue",
  world: "open-tongue",
  mole: "rodent",
  mouse: "rodent",
  rabbit: "rodent",
  scarecrow: "rodent",
  zombie: "rodent",
  deer: "none",
  cat: "fang",
  dog: "full-teeth",
};

/** Pastki iyak chizilmaydi — bug'u, quyosh, mushuk, kuchuk, boyo'q, jo'ja, kurka, pingvin, dunyo, qalqon, qo'rqinch */
export const QUIZ_BODY_NO_JAW: QuizBodyId[] = [
  "deer",
  "sun",
  "cat",
  "dog",
  "owl",
  "chick",
  "turkey",
  "penguin",
  "world",
  "skull",
  "scarecrow",
];

/** Iyak sal kamroq ko'rinadi — yumronqoziq, sichqon, quyon, zombi, miya */
export const QUIZ_BODY_SOFT_JAW: QuizBodyId[] = [
  "mole",
  "mouse",
  "rabbit",
  "zombie",
  "brain",
];

export const QUIZ_JAW_OPACITY_SOFT = 0.25;

export function getMouthStyle(body: QuizBodyId | null): MouthStyle {
  if (!body) return "open-tongue";
  return QUIZ_BODY_MOUTH[body];
}

export function hasNoLowerJaw(body: QuizBodyId | null): boolean {
  if (!body) return false;
  return (QUIZ_BODY_NO_JAW as readonly string[]).includes(body);
}

/** Happy ifodada iyak/til opaziteti (1 = to'liq) */
export function getJawOpacity(body: QuizBodyId | null): number {
  if (!body || hasNoLowerJaw(body)) return 1;
  if ((QUIZ_BODY_SOFT_JAW as readonly string[]).includes(body)) return QUIZ_JAW_OPACITY_SOFT;
  return 1;
}

/** Tanlash gridida faqat tana ikonlari */
export const QUIZ_AVATAR_IDS = [...QUIZ_BODY_IDS] as const;
export type QuizAvatarId = QuizBodyId;

/** Odatdagi yuz ifodasi — o'yin davomida */
export const DEFAULT_QUIZ_FACE: QuizFaceId = "satisfied-face";
export const DEFAULT_QUIZ_AVATAR = `${QUIZ_BODY_IDS[0]}:${DEFAULT_QUIZ_FACE}`;

export function isQuizFaceId(id: string): id is QuizFaceId {
  return (QUIZ_FACE_IDS as readonly string[]).includes(id);
}

export function isQuizBodyId(id: string): id is QuizBodyId {
  return (QUIZ_BODY_IDS as readonly string[]).includes(id);
}

export function isValidQuizAvatar(id: string): boolean {
  return parseQuizAvatar(id).body !== null;
}

/** O'yin bosqichiga qarab yuz ifodasi */
export function resolveQuizExpression(
  phase: QuizGamePhase,
  lastResult?: { answered: boolean; correct: boolean } | null
): QuizFaceId {
  if (phase === "PODIUM" || phase === "ENDED") return "happy-face";
  if (phase === "REVEAL" && lastResult?.answered) {
    return lastResult.correct ? "happy-face" : "sad-face";
  }
  return "satisfied-face";
}

/** "mouse:happy-face" → { body: "mouse", face: "happy-face" }; "happy-face" → faqat yuz */
export function parseQuizAvatar(id: string): { body: QuizBodyId | null; face: QuizFaceId } {
  if (id.includes(":")) {
    const [rawBody, rawFace] = id.split(":");
    if (isQuizBodyId(rawBody) && isQuizFaceId(rawFace)) {
      return { body: rawBody, face: rawFace };
    }
  }
  if (isQuizFaceId(id)) return { body: null, face: id };
  if (isQuizBodyId(id)) return { body: id, face: DEFAULT_QUIZ_FACE };
  return { body: null, face: DEFAULT_QUIZ_FACE };
}

export function encodeQuizAvatar(body: QuizBodyId | null, face: QuizFaceId): string {
  if (!body) return face;
  return `${body}:${face}`;
}

/** Tanlash uchun — faqat tana, yuz ifodasi o'yinda dinamik */
export function toSelectableAvatarId(id: QuizBodyId): string {
  return encodeQuizAvatar(id, DEFAULT_QUIZ_FACE);
}
