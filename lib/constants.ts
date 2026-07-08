// Platforma bo'ylab ishlatiladigan umumiy qiymatlar va o'zbekcha yorliqlar.
// SQLite enumlarni qo'llamagani uchun barcha status qiymatlari shu yerda saqlanadi.

export type Role = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "O'quvchi",
};

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

// ---------------- Davomat ----------------
export const ATTENDANCE_STATUS = {
  PRESENT: {
    label: "Keldi",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    xp: 10,
    points: 5,
  },
  LATE: {
    label: "Kechikdi",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    xp: 5,
    points: 2,
  },
  ABSENT: {
    label: "Kelmadi",
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
    xp: 0,
    points: 0,
  },
  EXCUSED: {
    label: "Sababli",
    badge: "bg-sky-100 text-sky-700",
    dot: "bg-sky-500",
    xp: 0,
    points: 0,
  },
} as const;
export type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

// ---------------- Uyga vazifa topshirig'i ----------------
export const SUBMISSION_STATUS = {
  SUBMITTED: { label: "Topshirildi", badge: "bg-sky-100 text-sky-700" },
  ACCEPTED: { label: "Tekshirildi", badge: "bg-emerald-100 text-emerald-700" },
  RETURNED: { label: "Qayta ishlash", badge: "bg-amber-100 text-amber-700" },
} as const;
export type SubmissionStatus = keyof typeof SUBMISSION_STATUS;

// O'quvchi ko'radigan vazifa holati (hosila)
export const HOMEWORK_VIEW_STATUS = {
  NEW: { label: "Yangi", badge: "bg-indigo-100 text-indigo-700" },
  IN_PROGRESS: { label: "Jarayonda", badge: "bg-sky-100 text-sky-700" },
  SUBMITTED: { label: "Topshirildi", badge: "bg-violet-100 text-violet-700" },
  CHECKED: { label: "Tekshirildi", badge: "bg-emerald-100 text-emerald-700" },
  LATE: { label: "Kechikdi", badge: "bg-amber-100 text-amber-700" },
  MISSED: { label: "Bajarilmadi", badge: "bg-rose-100 text-rose-700" },
} as const;
export type HomeworkViewStatus = keyof typeof HOMEWORK_VIEW_STATUS;

// ---------------- Imtihon topshirig'i ----------------
export const EXAM_RESULT_STATUS = {
  SUBMITTED: { label: "Topshirildi", badge: "bg-sky-100 text-sky-700" },
  ACCEPTED: { label: "Tekshirildi", badge: "bg-emerald-100 text-emerald-700" },
  RETURNED: { label: "Qayta ishlash", badge: "bg-amber-100 text-amber-700" },
} as const;
export type ExamResultStatus = keyof typeof EXAM_RESULT_STATUS;

export const EXAM_VIEW_STATUS = {
  UPCOMING: { label: "Boshlanmagan", badge: "bg-slate-100 text-slate-600" },
  ACTIVE: { label: "Faol", badge: "bg-indigo-100 text-indigo-700" },
  IN_PROGRESS: { label: "Jarayonda", badge: "bg-sky-100 text-sky-700" },
  SUBMITTED: { label: "Topshirildi", badge: "bg-violet-100 text-violet-700" },
  CHECKED: { label: "Tekshirildi", badge: "bg-emerald-100 text-emerald-700" },
  MISSED: { label: "O'tkazib yuborildi", badge: "bg-rose-100 text-rose-700" },
} as const;
export type ExamViewStatus = keyof typeof EXAM_VIEW_STATUS;

// ---------------- Magazin ----------------
export const PURCHASE_STATUS = {
  NEW: { label: "Yangi buyurtma", badge: "bg-sky-100 text-sky-700" },
  DELIVERED: { label: "Topshirildi", badge: "bg-emerald-100 text-emerald-700" },
  CANCELLED: { label: "Bekor qilindi", badge: "bg-rose-100 text-rose-700" },
} as const;
export type PurchaseStatus = keyof typeof PURCHASE_STATUS;

// ---------------- Qo'ng'iroqlar (kelmagan o'quvchilar) ----------------
export const CALL_STATUS = {
  NOT_CALLED: { label: "Qo'ng'iroq qilinmadi", badge: "bg-slate-100 text-slate-600" },
  NO_ANSWER: { label: "Javob bermadi", badge: "bg-amber-100 text-amber-700" },
  TALKED: { label: "Gaplashildi", badge: "bg-emerald-100 text-emerald-700" },
  EXCUSED: { label: "Sababli kelmadi", badge: "bg-sky-100 text-sky-700" },
  CALLBACK: { label: "Qayta qo'ng'iroq qilish", badge: "bg-violet-100 text-violet-700" },
} as const;
export type CallStatus = keyof typeof CALL_STATUS;

// ---------------- Bildirishnomalar ----------------
export const NOTIFICATION_AUDIENCE = {
  ALL_STUDENTS: { label: "Barcha o'quvchilar" },
  ALL_TEACHERS: { label: "Barcha o'qituvchilar" },
  GROUP: { label: "Ma'lum bir guruh" },
  CUSTOM: { label: "Tanlangan foydalanuvchilar" },
} as const;
export type NotificationAudience = keyof typeof NOTIFICATION_AUDIENCE;

export const NOTIFICATION_STATUS = {
  DRAFT: { label: "Qoralama", badge: "bg-slate-100 text-slate-600" },
  SCHEDULED: { label: "Rejalashtirilgan", badge: "bg-amber-100 text-amber-700" },
  SENT: { label: "Yuborilgan", badge: "bg-emerald-100 text-emerald-700" },
} as const;
export type NotificationStatus = keyof typeof NOTIFICATION_STATUS;

// ---------------- Quiz ----------------
export const QUIZ_TYPES = {
  NORMAL: { label: "Oddiy quiz" },
  SPEED: { label: "Tezkor quiz" },
  BATTLE: { label: "Battle" },
  EXAM: { label: "Imtihon quiz" },
  TEAM: { label: "Jamoaviy quiz" },
} as const;
export type QuizType = keyof typeof QUIZ_TYPES;

export {
  QUIZ_AVATAR_IDS,
  QUIZ_BODY_IDS,
  QUIZ_FACE_IDS,
  DEFAULT_QUIZ_AVATAR,
  DEFAULT_QUIZ_FACE,
  isValidQuizAvatar,
  parseQuizAvatar,
  encodeQuizAvatar,
  toSelectableAvatarId,
  resolveQuizExpression,
  type QuizGamePhase,
  type QuizBodyId,
  type QuizFaceId,
} from "@/lib/quiz-avatars";

// Kahoot uslubidagi jonli quiz ball tizimi
export const QUIZ_SCORING = {
  /** Eng tez to'g'ri javob uchun qo'shimcha ball — asosiy ballning shu ulushi (0..1) */
  speedBonusFraction: 0.5,
  /** Ketma-ket to'g'ri javoblar uchun bonus: min(100 * (streak - 1), 500) */
  streakBonusPerStep: 100,
  streakBonusMax: 500,
} as const;

// Javob variantlari belgilari va ranglari (Kahoot uslubida)
export const ANSWER_SHAPES = [
  { shape: "▲", letter: "A", bg: "bg-rose-500", hover: "hover:bg-rose-600", ring: "ring-rose-300" },
  { shape: "◆", letter: "B", bg: "bg-sky-500", hover: "hover:bg-sky-600", ring: "ring-sky-300" },
  { shape: "●", letter: "C", bg: "bg-amber-500", hover: "hover:bg-amber-600", ring: "ring-amber-300" },
  { shape: "■", letter: "D", bg: "bg-emerald-500", hover: "hover:bg-emerald-600", ring: "ring-emerald-300" },
] as const;

// ---------------- Administrator huquqlari ----------------
export const PERMISSIONS = [
  { key: "students.view", label: "O'quvchilarni ko'rish" },
  { key: "students.create", label: "O'quvchi yaratish" },
  { key: "students.edit", label: "O'quvchini tahrirlash" },
  { key: "students.delete", label: "O'quvchini o'chirish" },
  { key: "groups.create", label: "Guruh yaratish" },
  { key: "groups.manage", label: "Guruhlarni boshqarish" },
  { key: "attendance.manage", label: "Davomatni boshqarish" },
  { key: "teachers.manage", label: "O'qituvchilarni boshqarish" },
  { key: "categories.manage", label: "Fan kategoriyalarini boshqarish" },
  { key: "shop.manage", label: "Magazin boshqaruvi" },
  { key: "achievements.manage", label: "Yutuqlarni boshqarish" },
  { key: "notifications.send", label: "Bildirishnoma yuborish" },
  { key: "payments.manage", label: "To'lovlarni boshqarish" },
  { key: "reports.view", label: "Hisobotlarni ko'rish" },
  { key: "calls.manage", label: "Kelmaganlar bilan ishlash" },
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

// ---------------- Turlari ----------------
export const TEACHER_TYPES = ["Asosiy o'qituvchi", "Yordamchi o'qituvchi", "Master o'qituvchi"];
export const STUDENT_TYPES = ["Oddiy", "Ijtimoiy"] as const;
export type StudentType = (typeof STUDENT_TYPES)[number];
export const SOCIAL_STUDENT_TYPE: StudentType = "Ijtimoiy";

export const STUDENT_TYPE_HINTS: Record<StudentType, string> = {
  Oddiy: "Oylik to'lov qiladi",
  Ijtimoiy: "To'lov qilmaydi (ijtimoiy dastur)",
};

export function isSocialStudent(studentType: string | null | undefined): boolean {
  return studentType === SOCIAL_STUDENT_TYPE;
}
export const GROUP_TYPES = ["Umumiy", "Individual", "Intensiv", "Online"];

// Demo seed uchun standart fan kategoriyalari
export const DEFAULT_SUBJECTS = [
  "Matematika",
  "Fizika",
  "Ingliz tili",
  "Frontend",
  "Backend",
  "Biologiya",
  "Python",
];

export const WEEKDAYS = [
  "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba",
];

// JS getDay() (0=Yakshanba) -> WEEKDAYS indeksiga moslash
export function weekdayNameFor(date: Date): string {
  const jsDay = date.getDay(); // 0..6, 0 = Yakshanba
  return WEEKDAYS[(jsDay + 6) % 7];
}

// ---------------- Gamifikatsiya stavkalari ----------------
export const RATES = {
  // uyga vazifa: yakuniy ball asosida
  homeworkXp: 1, // xp = yakuniy ball * 1
  homeworkPoints: 0.5, // ball = yakuniy ball * 0.5
  // imtihon
  examXp: 1,
  examPoints: 0.5,
  examPerfectBonus: 50,
  // quiz (Setting jadvalida qayta belgilanishi mumkin)
  quizXp: 0.05,
  quizPoints: 0.015,
} as const;

export const SETTING_KEYS = {
  homeworkXpRate: "homework_xp_rate",
  homeworkPointRate: "homework_point_rate",
  examXpRate: "exam_xp_rate",
  examPointRate: "exam_point_rate",
  examPerfectBonus: "exam_perfect_bonus",
  attPresentXp: "att_present_xp",
  attPresentPoints: "att_present_points",
  attLateXp: "att_late_xp",
  attLatePoints: "att_late_points",
  quizXpRate: "quiz_xp_rate",
  quizPointRate: "quiz_point_rate",
  quizSpeedBonusFraction: "quiz_speed_bonus_fraction",
  quizStreakBonusPerStep: "quiz_streak_bonus_per_step",
  quizStreakBonusMax: "quiz_streak_bonus_max",
} as const;

export const ALL_SETTING_KEYS = Object.values(SETTING_KEYS);

// ---------------- Yutuqlar ----------------
export const ACHIEVEMENT_CODES = {
  STREAK_7: "STREAK_7",
  HOMEWORK_10_ONTIME: "HOMEWORK_10_ONTIME",
  EARLY_5: "EARLY_5",
  QUIZ_WINNER: "QUIZ_WINNER",
  TOP3_GROUP: "TOP3_GROUP",
  EXAM_PERFECT: "EXAM_PERFECT",
  MONTH_CHAMPION: "MONTH_CHAMPION",
} as const;

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[keyof typeof ACHIEVEMENT_CODES];

/** Admin formasi uchun yutuq kodlari va shartlari */
export const ACHIEVEMENT_CODE_OPTIONS: { code: AchievementCode; label: string }[] = [
  { code: ACHIEVEMENT_CODES.STREAK_7, label: "7 kun ketma-ket faollik (streak)" },
  { code: ACHIEVEMENT_CODES.HOMEWORK_10_ONTIME, label: "10 ta vazifa o'z vaqtida (jarimasiz)" },
  { code: ACHIEVEMENT_CODES.EARLY_5, label: "5 ta vazifa muddatidan oldin (bonusli)" },
  { code: ACHIEVEMENT_CODES.QUIZ_WINNER, label: "Quizda 1-o'rin" },
  { code: ACHIEVEMENT_CODES.TOP3_GROUP, label: "Guruh reytingida haftalik TOP 3 (yakshanba 00:00)" },
  { code: ACHIEVEMENT_CODES.EXAM_PERFECT, label: "Imtihondan 100% natija" },
  { code: ACHIEVEMENT_CODES.MONTH_CHAMPION, label: "Oy chempioni (oy oxirida 00:00, guruh bo'yicha)" },
];
