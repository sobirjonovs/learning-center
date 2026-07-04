# EduCenter — O'quv markaz boshqaruv platformasi

O'quv markaz faoliyatini boshqarish, davomat, uyga vazifalar, imtihonlar, ichki magazin,
bildirishnomalar va real vaqt rejimidagi **Quiz Battle** tizimini o'z ichiga olgan yagona platforma.
Texnik topshiriq: `task.txt`.

## Texnologiyalar

- **Next.js 15** (App Router, Server Components + Server Actions), React 19, TypeScript
- **Prisma + SQLite** — ma'lumotlar bazasi (fayl: `prisma/dev.db`)
- **Tailwind CSS v4** — dizayn
- **SSE (Server-Sent Events)** — Quiz Battle real vaqt oqimi
- **jose (JWT cookie)** + bcryptjs — autentifikatsiya

## Ishga tushirish

```bash
npm install
npm run db:push    # bazani yaratish
npm run db:seed    # demo ma'lumotlar
npm run dev        # http://localhost:3000
```

## Demo hisoblar

| Rol | Login | Parol |
|---|---|---|
| Super Admin | `admin` | `admin123` |
| Administrator | `manager` | `admin123` |
| O'qituvchi | `aziz.teacher` (yoki `madina.teacher`, `jasur.teacher`, `dilnoza.teacher`) | `teacher123` |
| O'quvchi | `student1` … `student20` | `student123` |

## Rollar va imkoniyatlar

- **Super Admin** (`/admin`) — dashboard (statistika, grafiklar, eng faol o'qituvchilar/guruhlar/o'quvchilar),
  o'qituvchilar/guruhlar/o'quvchilar CRUD va profillari, davomat nazorati, magazin va xaridlar tarixi,
  bildirishnomalar (auditoriya tanlash + rejalashtirish), administratorlar va individual huquqlar, sozlamalar.
- **Administrator** (`/admin`) — Super Admin bergan huquqlar doirasida; kelmagan o'quvchilar bilan ishlash
  (qo'ng'iroq statuslari va tarixi — bo'lim 5.1).
- **O'qituvchi** (`/teacher`) — dashboard, o'z guruhlari, davomat (kunlik/haftalik/oylik statistika),
  uyga vazifalar (bonus/jarima bilan baholash), imtihonlar, reyting, **Quiz Battle** yaratish va o'tkazish.
- **O'quvchi** (`/student`) — gamifikatsiyalangan dashboard (ball, XP, level, streak, reyting o'rni),
  vazifa topshirish (link/fayl), reyting, PIN orqali quizga qo'shilish, magazin, yutuqlar, bildirishnomalar.

## Gamifikatsiya

- **Ball** — magazinda ishlatiladi; **XP** — levelni oshiradi (ikkalasi alohida, `ScoreTransaction` daftarida).
- Manbalar: davomat (Keldi +10 XP/+5 ball), uyga vazifa (yakuniy ball asosida), imtihon, quiz
  (koeffitsiyentlar `/admin/settings` da), yutuqlar.
- **Streak** — ketma-ket faol kunlar. **Yutuqlar** — 7 ta shart (7 kunlik seriya, 10 vazifa o'z vaqtida,
  quiz chempioni, TOP-3, 100% imtihon va h.k.) avtomatik tekshiriladi.
- Vazifani muddatidan oldin topshirish — kuniga bonus, kechikish — kuniga jarima (avtomatik).

## Quiz Battle (Kahoot uslubida)

1. O'qituvchi quiz yaratadi (savollar: 2–4 variant, vaqt, ball) → **Boshlash** → tizim 6 xonali **Game PIN** yaratadi.
2. O'quvchi telefonida PIN kiritadi, emoji-avatar tanlaydi, lobbyga qo'shiladi.
3. Savol o'qituvchi (katta) ekranida ko'rinadi; o'quvchida faqat ▲◆●■ tugmalari.
4. Ball = to'g'ri javob + tezlik bonusi + streak bonusi. Har savoldan keyin natija va Live Leaderboard.
5. Yakunda podium (3→2→1 animatsiya) va shaxsiy natijalar; XP/ball avtomatik reytingga qo'shiladi.

Real vaqt uchun alohida server kerak emas — o'yin holati xotirada, hodisalar SSE orqali uzatiladi
(bitta Node jarayoni uchun mo'ljallangan).

## Foydali skriptlar

```bash
npm run typecheck   # TypeScript tekshiruvi
npm run build       # production build
npm run db:seed     # bazani demo holatga qaytarish
```

Yuklangan fayllar `public/uploads/` ichida saqlanadi.
