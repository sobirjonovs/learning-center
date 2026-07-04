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

export const EMOJI_AVATARS = [
  "😀", "😎", "🤓", "🥷", "👻", "🤖", "🦊", "🐼", "🐯",
  "🦁", "🐸", "🐵", "🐧", "🐲", "👽", "🚀", "⚡", "🔥",
];

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
  { key: "shop.manage", label: "Magazin boshqaruvi" },
  { key: "notifications.send", label: "Bildirishnoma yuborish" },
  { key: "reports.view", label: "Hisobotlarni ko'rish" },
  { key: "calls.manage", label: "Kelmaganlar bilan ishlash" },
] as const;
export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

// ---------------- Turlari ----------------
export const TEACHER_TYPES = ["Asosiy o'qituvchi", "Yordamchi o'qituvchi", "Master o'qituvchi"];
export const STUDENT_TYPES = ["Oddiy", "Premium", "VIP"];
export const GROUP_TYPES = ["Umumiy", "Individual", "Intensiv", "Online"];

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
  // quiz (Setting jadvalida qayta belgilanishi mumkin)
  quizXp: 0.05,
  quizPoints: 0.015,
} as const;

export const SETTING_KEYS = {
  quizXpRate: "quiz_xp_rate",
  quizPointRate: "quiz_point_rate",
} as const;

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
