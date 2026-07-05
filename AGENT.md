# AGENT.md — EduCenter (Learning Center)

Bu fayl AI agentlar uchun loyiha bo'yicha yo'riqnoma. Kod yozish, xatolarni tuzatish yoki yangi funksiya qo'shishdan oldin shu hujjatni o'qing.

## Loyiha haqida

**EduCenter** — o'quv markaz boshqaruv platformasi. Rollar: Super Admin, Administrator, O'qituvchi, O'quvchi.

Asosiy modullar: dashboard, davomat, uyga vazifalar, imtihonlar, reyting, ichki magazin, bildirishnomalar, gamifikatsiya, **Quiz Battle** (Kahoot uslubida, SSE orqali real vaqt).

To'liq texnik topshiriq: `task.txt`  
Foydalanuvchi qo'llanmasi: `README.md`

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Ma'lumotlar bazasi | Prisma + SQLite (`prisma/dev.db`) |
| Stil | Tailwind CSS v4 |
| Auth | JWT cookie (`jose`) + bcryptjs |
| Real vaqt | SSE (Server-Sent Events) — Quiz Battle |
| Fayl yuklash | `public/uploads/` |

## Ishga tushirish

```bash
npm install
npm run db:push    # bazani yaratish
npm run db:seed    # demo ma'lumotlar
npm run dev        # http://localhost:3000
npm run typecheck  # TypeScript tekshiruvi
npm run build      # production build
```

## Loyiha tuzilmasi

```
app/
  admin/          # Super Admin + Administrator paneli
  teacher/        # O'qituvchi kabineti
  student/        # O'quvchi kabineti
  login/          # Kirish
  api/quiz-live/  # Quiz Battle REST + SSE endpointlari
components/       # Umumiy UI (ui.tsx, sidebar, app-shell, ...)
lib/              # Yordamchi modullar (db, auth, gamification, ...)
prisma/           # schema.prisma, seed.ts, dev.db
public/uploads/   # Yuklangan fayllar
middleware.ts     # Rol asosida route himoyasi
```

Har bir modul odatda quyidagi tuzilmaga ega:

- `page.tsx` — Server Component (ma'lumot o'qish)
- `actions.ts` — Server Actions (`"use server"`)
- `*-form.tsx` — Client Component (formalar)

## Asosiy qoidalar (agentlar uchun)

### 1. Minimal o'zgarish

Faqat so'ralgan vazifani bajaring. Bog'liq bo'lmagan refaktor, formatlash yoki qo'shimcha funksiya qo'shmang.

### 2. Mavjud konventsiyalarga rioya qiling

- **O'zbekcha** UI matnlari va izohlar (kod ichidagi commentlar ham odatda o'zbekcha)
- **Server Actions** — mutatsiya (CRUD) uchun; alohida API route faqat Quiz Live kabi maxsus holatlar uchun
- **Server Components** — ma'lumot o'qish; `"use client"` faqat interaktiv qismlar uchun
- **Prisma** — barcha DB operatsiyalari `lib/db.ts` orqali
- **Tailwind** — inline class; alohida CSS fayl qo'shmang (globals.css dan tashqari)

### 3. Enum o'rniga String + constants

SQLite enum qo'llamaydi. Barcha status/rol qiymatlari:

- `prisma/schema.prisma` — `String` maydonlar
- `lib/constants.ts` — rasmiy qiymatlar, yorliqlar, badge ranglari

Yangi status qo'shsangiz, **ikkala joyni** ham yangilang.

### 4. Autentifikatsiya va huquqlar

```
middleware.ts     → route darajasida rol tekshiruvi
lib/auth.ts       → getSession(), requireRole(), can(), requirePermission()
lib/session.ts    → JWT cookie yaratish/tekshirish
```

- **SUPER_ADMIN** — hamma huquq
- **ADMIN** — `session.permissions` dagi individual huquqlar (`PermissionKey`)
- **TEACHER** — faqat o'z guruhlari
- **STUDENT** — faqat o'z ma'lumotlari

Admin `actions.ts` fayllarida odatda:

```typescript
async function guard(permission: PermissionKey) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, permission);
  return session;
}
```

Teacher actions da: `requireRole("TEACHER")` va guruh/o'qituvchi tegishliligini tekshiring.

### 5. Server Actions andozasi

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/log";

export async function createSomething(formData: FormData) {
  const session = await requireRole("TEACHER");
  // ... validatsiya va DB operatsiyasi
  await logActivity(session.id, "action.name", "tafsilot");
  revalidatePath("/teacher/something");
  redirect("/teacher/something");
}
```

Formadan ma'lumot o'qish: `readForm(formData)` yordamchi funksiyasi (har modulda alohida).

### 6. UI komponentlari

`components/ui.tsx` dagi primitivlardan foydalaning:

- `Card`, `CardTitle`, `StatCard`
- `Button`, `Input`, `Select`, `Textarea`
- `Badge`, `Table`, `EmptyState`
- `PageHeader`, `Alert`

Layout: `components/app-shell.tsx` + `components/sidebar.tsx`

### 7. Gamifikatsiya

`lib/gamification.ts` — ball/XP berish markaziy joyi.

- **Ball (`points`)** — magazin uchun
- **XP** — level uchun (`levelFromXp()` in `lib/utils.ts`)
- **ScoreTransaction** — barcha ball/XP harakatlari daftari
- **Achievement** — `lib/gamification.ts` da avtomatik tekshiriladi

Ball/XP o'zgartirishda **doimo** `awardScore()` yoki tegishli gamification funksiyasidan foydalaning; `User.points` ni to'g'ridan-to'g'ri o'zgartirmang.

### 8. Quiz Battle (maxsus e'tibor)

```
lib/quiz-live.ts              → o'yin dvigateli (xotirada, globalThis)
app/api/quiz-live/[pin]/      → join, start, answer, next, end, kick, stream
app/teacher/quizzes/[id]/host → o'qituvchi ekrani
app/student/quiz/play/[pin]   → o'quvchi ekrani
```

- O'yin holati **xotirada** saqlanadi (Redis yo'q) — bitta Node jarayoni uchun
- Real vaqt: SSE (`/api/quiz-live/[pin]/stream`)
- O'qituvchi ekranida savol ko'rinadi; o'quvchi ekranida faqat ▲◆●■ tugmalari
- Quiz tugagach natijalar DB ga (`QuizResult`) va gamifikatsiyaga yoziladi

Quiz bilan ishlashda mavjud `lib/quiz-live.ts` API sini kengaytiring; parallel holat boshqaruv tizimi qo'shmang.

### 9. Fayl yuklash

`lib/uploads.ts` → `saveUpload(formData, fieldName)`  
Fayllar `public/uploads/` ga saqlanadi.

### 10. Schema o'zgartirish

1. `prisma/schema.prisma` ni tahrirlang
2. `npm run db:push`
3. Kerak bo'lsa `prisma/seed.ts` ni yangilang
4. `lib/constants.ts` ga yangi qiymatlarni qo'shing

## Rollar va yo'nalishlar

| Rol | Prefix | Demo login | Parol |
|-----|--------|------------|-------|
| Super Admin | `/admin` | `admin` | `admin123` |
| Administrator | `/admin` | `manager` | `admin123` |
| O'qituvchi | `/teacher` | `aziz.teacher` | `teacher123` |
| O'quvchi | `/student` | `student1` … `student20` | `student123` |

## Muhim fayllar

| Fayl | Vazifasi |
|------|----------|
| `lib/constants.ts` | Rollar, statuslar, huquqlar, yorliqlar |
| `lib/auth.ts` | Sessiya va huquq tekshiruvi |
| `lib/gamification.ts` | Ball, XP, yutuqlar |
| `lib/homework.ts` | Vazifa holati, bonus/jarima hisoblash |
| `lib/quiz-live.ts` | Jonli quiz dvigateli |
| `lib/utils.ts` | `cn()`, `formatDate()`, `levelFromXp()`, JSON yordamchilari |
| `middleware.ts` | Route himoyasi |

## Nima qilmaslik kerak

- `.env`, `prisma/dev.db`, `.next/` ni commit qilmaslik
- Yangi npm paket qo'shishdan oldin mavjud yechim bor-yo'qligini tekshiring
- Prisma enum ishlatmang (SQLite qo'llamaydi)
- UI matnlarini inglizchaga o'zgartirmang (loyiha o'zbek tilida)
- README.md yoki boshqa hujjatlarni foydalanuvchi so'ramaguncha yaratmang/o'zgartirmang
- Git commit yaratmang — faqat foydalanuvchi so'raganda

## Yangi funksiya qo'shish tartibi

1. `task.txt` dagi talablarni tekshiring
2. Schema kerak bo'lsa — `prisma/schema.prisma` + `constants.ts`
3. Server Action (`actions.ts`) + forma komponenti
4. Sahifa (`page.tsx`) — Server Component
5. `revalidatePath()` va kerak bo'lsa `logActivity()`
6. Admin bo'limi bo'lsa — `PermissionKey` va sidebar (`layout.tsx`) ga qo'shing
7. `npm run typecheck` ishga tushiring

## Tekshiruv

O'zgarishlardan keyin:

```bash
npm run typecheck
```

Agar schema o'zgargan bo'lsa:

```bash
npm run db:push
npm run db:seed   # kerak bo'lsa
```

## Til va matnlar

- Foydalanuvchi interfeysi: **O'zbekcha** (lotin)
- Kod izohlari: o'zbekcha
- O'zgaruvchi/funktsiya nomlari: inglizcha (camelCase)
- Fayl nomlari: kebab-case yoki Next.js konvensiyasi (`page.tsx`, `actions.ts`)
