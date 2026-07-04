// Demo ma'lumotlar bilan bazani to'ldirish: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Deterministik pseudo-random (qayta ishga tushirishda barqaror)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260704);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba", "Yakshanba"];
const weekdayName = (d: Date) => WEEKDAYS[(d.getDay() + 6) % 7];
const pad = (n: number) => String(n).padStart(2, "0");
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function main() {
  console.log("Baza tozalanmoqda...");
  // FK tartibida tozalash
  await db.activityLog.deleteMany();
  await db.callLog.deleteMany();
  await db.studentAchievement.deleteMany();
  await db.achievement.deleteMany();
  await db.scoreTransaction.deleteMany();
  await db.quizResult.deleteMany();
  await db.quizQuestion.deleteMany();
  await db.quiz.deleteMany();
  await db.notificationRecipient.deleteMany();
  await db.notification.deleteMany();
  await db.purchase.deleteMany();
  await db.product.deleteMany();
  await db.examResult.deleteMany();
  await db.exam.deleteMany();
  await db.submission.deleteMany();
  await db.homework.deleteMany();
  await db.attendance.deleteMany();
  await db.groupStudent.deleteMany();
  await db.group.deleteMany();
  await db.setting.deleteMany();
  await db.user.deleteMany();

  console.log("Foydalanuvchilar yaratilmoqda...");
  const [adminHash, teacherHash, studentHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("teacher123", 10),
    bcrypt.hash("student123", 10),
  ]);

  const superAdmin = await db.user.create({
    data: {
      role: "SUPER_ADMIN",
      name: "Sardor Alimov",
      login: "admin",
      password: adminHash,
      phone: "+998 90 123 45 67",
      permissions: JSON.stringify([]),
    },
  });

  await db.user.create({
    data: {
      role: "ADMIN",
      name: "Nilufar Rashidova",
      login: "manager",
      password: adminHash,
      phone: "+998 91 234 56 78",
      permissions: JSON.stringify([
        "students.view",
        "students.create",
        "students.edit",
        "groups.create",
        "groups.manage",
        "attendance.manage",
        "calls.manage",
        "notifications.send",
      ]),
    },
  });

  const teacherData = [
    { name: "Aziz Karimov", login: "aziz.teacher", type: "Asosiy o'qituvchi", phone: "+998 93 111 22 33" },
    { name: "Madina Yusupova", login: "madina.teacher", type: "Master o'qituvchi", phone: "+998 94 222 33 44" },
    { name: "Jasur Toshmatov", login: "jasur.teacher", type: "Asosiy o'qituvchi", phone: "+998 95 333 44 55" },
    { name: "Dilnoza Saidova", login: "dilnoza.teacher", type: "Yordamchi o'qituvchi", phone: "+998 97 444 55 66" },
  ];
  const teachers = [];
  for (const t of teacherData) {
    teachers.push(
      await db.user.create({
        data: {
          role: "TEACHER",
          name: t.name,
          login: t.login,
          password: teacherHash,
          phone: t.phone,
          teacherType: t.type,
        },
      })
    );
  }

  const studentNames = [
    "Aziz Rahimov", "Madina Karimova", "Bekzod Aliyev", "Sevara Tosheva",
    "Jahongir Umarov", "Nodira Islomova", "Sardor Yo'ldoshev", "Zilola Mirzayeva",
    "Timur Xasanov", "Gulnora Sattorova", "Otabek Nazarov", "Kamila Ergasheva",
    "Farrux Qodirov", "Malika Abdullayeva", "Shoxrux Berdiyev", "Dildora Hamidova",
    "Ulug'bek Sobirov", "Shahzoda Nurmatova", "Islom Raximberdiyev", "Laylo Yusufjonova",
  ];
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    students.push(
      await db.user.create({
        data: {
          role: "STUDENT",
          name: studentNames[i],
          login: `student${i + 1}`,
          password: studentHash,
          phone: `+998 9${i % 10} ${100 + i} ${10 + i} ${20 + i}`,
          parentPhone: `+998 9${(i + 3) % 10} ${200 + i} ${30 + i} ${40 + i}`,
          studentType: i % 7 === 0 ? "Premium" : i % 11 === 0 ? "VIP" : "Oddiy",
          active: i !== 19, // bittasi faolsiz
        },
      })
    );
  }

  console.log("Guruhlar yaratilmoqda...");
  const groupDefs = [
    { name: "Frontend A-1", type: "Umumiy", teacher: 0, days: ["Dushanba", "Chorshanba", "Juma"], time: "14:00 - 16:00", room: "201" },
    { name: "Backend B-2", type: "Intensiv", teacher: 0, days: ["Seshanba", "Payshanba", "Shanba"], time: "10:00 - 12:00", room: "202" },
    { name: "Ingliz tili C-1", type: "Umumiy", teacher: 1, days: ["Seshanba", "Payshanba", "Shanba"], time: "16:00 - 18:00", room: "105" },
    { name: "Matematika M-3", type: "Umumiy", teacher: 2, days: ["Dushanba", "Chorshanba", "Juma"], time: "09:00 - 11:00", room: "301" },
    { name: "IELTS Pro", type: "Intensiv", teacher: 1, days: ["Shanba", "Yakshanba"], time: "11:00 - 13:30", room: "106" },
    { name: "Python kids", type: "Online", teacher: 3, days: ["Chorshanba", "Juma"], time: "17:00 - 18:30", room: null as string | null, active: false },
  ];
  const groups = [];
  for (const g of groupDefs) {
    groups.push(
      await db.group.create({
        data: {
          name: g.name,
          type: g.type,
          teacherId: teachers[g.teacher].id,
          days: JSON.stringify(g.days),
          time: g.time,
          room: g.room ?? undefined,
          startDate: daysAgo(60),
          endDate: new Date(Date.now() + 90 * 86_400_000),
          active: g.active !== false,
        },
      })
    );
  }

  // O'quvchilarni guruhlarga taqsimlash (ba'zilari 2 guruhda)
  const membership: Record<number, number[]> = {
    0: [0, 1, 2, 3, 4, 5, 6],
    1: [7, 8, 9, 10, 11],
    2: [0, 2, 12, 13, 14, 15],
    3: [4, 6, 16, 17, 18],
    4: [1, 3, 8, 13],
    5: [16, 19],
  };
  for (const [gi, sids] of Object.entries(membership)) {
    for (const si of sids) {
      await db.groupStudent.create({
        data: { groupId: groups[Number(gi)].id, studentId: students[si].id },
      });
    }
  }

  console.log("Davomat yozuvlari (so'nggi 45 kun)...");
  const txs: Array<{
    studentId: string;
    points: number;
    xp: number;
    reason: string;
    sourceType: string;
    createdAt: Date;
  }> = [];
  const attendanceRows: Array<{
    groupId: string;
    studentId: string;
    date: string;
    status: string;
    markedById: string;
  }> = [];

  for (let gi = 0; gi < groups.length; gi++) {
    const g = groupDefs[gi];
    if (g.active === false) continue;
    const teacherId = teachers[g.teacher].id;
    for (let back = 45; back >= 0; back--) {
      const day = daysAgo(back);
      if (!g.days.includes(weekdayName(day))) continue;
      for (const si of membership[gi]) {
        if (si === 19) continue; // faolsiz o'quvchi
        const r = rand();
        // bugungi kunda ayrim o'quvchilar atayin "Kelmadi"
        let status: string;
        if (back === 0) {
          status = r < 0.2 ? "ABSENT" : r < 0.28 ? "LATE" : r < 0.33 ? "EXCUSED" : "PRESENT";
        } else {
          status = r < 0.78 ? "PRESENT" : r < 0.88 ? "LATE" : r < 0.95 ? "ABSENT" : "EXCUSED";
        }
        attendanceRows.push({
          groupId: groups[gi].id,
          studentId: students[si].id,
          date: dateStr(day),
          status,
          markedById: teacherId,
        });
        const xp = status === "PRESENT" ? 10 : status === "LATE" ? 5 : 0;
        const points = status === "PRESENT" ? 5 : status === "LATE" ? 2 : 0;
        if (xp > 0) {
          txs.push({
            studentId: students[si].id,
            points,
            xp,
            reason: `Davomat (${dateStr(day)}): ${status === "PRESENT" ? "Keldi" : "Kechikdi"}`,
            sourceType: "ATTENDANCE",
            createdAt: day,
          });
        }
      }
    }
  }
  // unique cheklovga rioya qilgan holda yaratish
  for (const row of attendanceRows) {
    await db.attendance.create({ data: row });
  }

  console.log("Uyga vazifalar...");
  for (let gi = 0; gi < 5; gi++) {
    const teacherId = teachers[groupDefs[gi].teacher].id;
    const groupId = groups[gi].id;

    // 1) baholangan (muddat 7 kun oldin)
    const hw1 = await db.homework.create({
      data: {
        groupId,
        teacherId,
        title: `${groupDefs[gi].name}: ${gi + 3}-mavzu bo'yicha amaliy vazifa`,
        description: "Darsda o'tilgan mavzu bo'yicha mashqlarni bajaring va natijani yuklang.",
        startAt: daysAgo(14),
        dueAt: daysAgo(7),
        maxScore: 100,
        earlyBonus: 10,
        latePenalty: 15,
      },
    });
    for (const si of membership[gi]) {
      if (si === 19) continue;
      const r = rand();
      if (r < 0.15) continue; // topshirmagan
      const early = r < 0.45 ? Math.floor(rand() * 3) : 0; // 0-2 kun oldin
      const late = early === 0 && r > 0.8 ? 1 : 0;
      const submittedAt = new Date(daysAgo(7).getTime() - early * 86_400_000 + late * 86_400_000);
      const base = 60 + Math.floor(rand() * 41);
      const bonus = early * 10;
      const penalty = late * 15;
      const final = Math.max(0, base + bonus - penalty);
      const gradedAt = daysAgo(5);
      await db.submission.create({
        data: {
          homeworkId: hw1.id,
          studentId: students[si].id,
          link: r < 0.5 ? "https://github.com/example/homework" : undefined,
          submittedAt,
          status: "ACCEPTED",
          baseScore: base,
          bonus,
          penalty,
          score: final,
          feedback: pick(["Yaxshi ish!", "Zo'r bajarilgan", "Kichik xatolar bor, lekin umuman yaxshi", "Barakalla!"]),
          gradedAt,
        },
      });
      txs.push({
        studentId: students[si].id,
        points: Math.round(final * 0.5),
        xp: final,
        reason: `Uyga vazifa: ${hw1.title}`,
        sourceType: "HOMEWORK",
        createdAt: gradedAt,
      });
    }

    // 2) faol (muddat +3 kun) — ba'zilari topshirgan, tekshirilmagan
    const hw2 = await db.homework.create({
      data: {
        groupId,
        teacherId,
        title: `${groupDefs[gi].name}: mustaqil ish`,
        description: "Berilgan mavzu bo'yicha mustaqil ish tayyorlang. Link yoki fayl orqali topshiring.",
        startAt: daysAgo(3),
        dueAt: new Date(Date.now() + 3 * 86_400_000),
        maxScore: 100,
        earlyBonus: 10,
        latePenalty: 10,
      },
    });
    for (const si of membership[gi].slice(0, 3)) {
      if (si === 19) continue;
      await db.submission.create({
        data: {
          homeworkId: hw2.id,
          studentId: students[si].id,
          link: "https://docs.google.com/document/d/example",
          submittedAt: daysAgo(1),
          status: "SUBMITTED",
        },
      });
    }

    // 3) kelgusi (boshlanishi ertaga)
    await db.homework.create({
      data: {
        groupId,
        teacherId,
        title: `${groupDefs[gi].name}: loyiha taqdimoti`,
        description: "Yakuniy loyihangizni tayyorlab, taqdimot fayl sifatida yuklang.",
        startAt: new Date(Date.now() + 1 * 86_400_000),
        dueAt: new Date(Date.now() + 10 * 86_400_000),
        maxScore: 100,
        earlyBonus: 20,
        latePenalty: 20,
      },
    });
  }

  console.log("Imtihonlar...");
  for (let gi = 0; gi < 5; gi++) {
    const exam = await db.exam.create({
      data: {
        groupId: groups[gi].id,
        title: `${groupDefs[gi].name} — oraliq imtihon`,
        date: daysAgo(10),
        maxScore: 100,
      },
    });
    for (const si of membership[gi]) {
      if (si === 19) continue;
      const score = si === 0 && gi === 0 ? 100 : 50 + Math.floor(rand() * 51);
      await db.examResult.create({
        data: { examId: exam.id, studentId: students[si].id, score },
      });
      txs.push({
        studentId: students[si].id,
        points: Math.round(score * 0.5),
        xp: score,
        reason: `Imtihon: ${groupDefs[gi].name} — oraliq imtihon`,
        sourceType: "EXAM",
        createdAt: daysAgo(10),
      });
    }
  }

  console.log("Magazin...");
  const productDefs = [
    { name: "Firmennaya futbolka", description: "O'quv markaz logotipi tushirilgan sifatli futbolka", price: 500, stock: 25 },
    { name: "Termos-krujka", description: "Issiq ichimliklar uchun 350ml termos-krujka", price: 350, stock: 15 },
    { name: "Bluetooth quloqchin", description: "Simsiz quloqchin — eng faol o'quvchilar uchun", price: 2000, stock: 5 },
    { name: "Kitob: Atomic Habits", description: "O'zbek tilidagi nashri", price: 400, stock: 12 },
    { name: "Ruchka to'plami", description: "3 ta rangli gel ruchka to'plami", price: 100, stock: 50 },
    { name: "Bepul dars kuponi", description: "1 ta individual dars uchun kupon", price: 1500, stock: 10 },
    { name: "Stiker paket", description: "Dasturchilar uchun 20 ta stiker", price: 80, stock: 100 },
    { name: "Power bank 10000mAh", description: "Kuchli power bank", price: 1800, stock: 0, active: false },
  ];
  const products = [];
  for (const p of productDefs) {
    products.push(
      await db.product.create({
        data: { ...p, active: p.active !== false },
      })
    );
  }
  const purchaseDefs = [
    { si: 0, pi: 4, status: "DELIVERED", back: 12 },
    { si: 1, pi: 6, status: "DELIVERED", back: 9 },
    { si: 4, pi: 1, status: "NEW", back: 1 },
    { si: 7, pi: 0, status: "NEW", back: 0 },
    { si: 2, pi: 3, status: "CANCELLED", back: 5 },
  ];
  for (const p of purchaseDefs) {
    const product = products[p.pi];
    await db.purchase.create({
      data: {
        studentId: students[p.si].id,
        productId: product.id,
        points: product.price,
        status: p.status,
        createdAt: daysAgo(p.back),
      },
    });
    if (p.status !== "CANCELLED") {
      txs.push({
        studentId: students[p.si].id,
        points: -product.price,
        xp: 0,
        reason: `Xarid: ${product.name}`,
        sourceType: "PURCHASE",
        createdAt: daysAgo(p.back),
      });
    }
  }

  console.log("Quizlar...");
  const quiz1 = await db.quiz.create({
    data: {
      teacherId: teachers[0].id,
      groupId: groups[0].id,
      name: "Kompyuter asoslari",
      description: "Kompyuter qurilmalari va asosiy tushunchalar bo'yicha quiz",
      subject: "Informatika",
      type: "NORMAL",
      countsToRating: true,
    },
  });
  const q1Questions: Array<[string, string[], number]> = [
    ["Kompyuterning asosiy hisoblash qurilmasi qaysi?", ["Protsessor", "Monitor", "Sichqoncha", "Printer"], 0],
    ["Operativ xotira qisqartmasi qanday?", ["ROM", "RAM", "SSD", "CPU"], 1],
    ["Qaysi qurilma ma'lumotni doimiy saqlaydi?", ["RAM", "Kesh", "SSD", "Registr"], 2],
    ["1 bayt necha bitdan iborat?", ["4", "8", "16", "32"], 1],
    ["Qaysi biri kiritish qurilmasi?", ["Monitor", "Printer", "Klaviatura"], 2],
    ["Internetda sahifalarni ko'rish dasturi?", ["Brauzer", "Kompilyator"], 0],
    ["HTML nima uchun ishlatiladi?", ["Sahifa tuzilishi", "Ma'lumotlar bazasi", "Tarmoq sozlash", "Video montaj"], 0],
    ["Qaysi biri operatsion tizim?", ["Excel", "Linux", "Chrome", "Photoshop"], 1],
  ];
  for (let i = 0; i < q1Questions.length; i++) {
    await db.quizQuestion.create({
      data: {
        quizId: quiz1.id,
        order: i,
        text: q1Questions[i][0],
        options: JSON.stringify(q1Questions[i][1]),
        correctIndex: q1Questions[i][2],
        timeSeconds: 20,
        points: 500,
      },
    });
  }

  const quiz2 = await db.quiz.create({
    data: {
      teacherId: teachers[1].id,
      groupId: groups[2].id,
      name: "English Vocabulary Battle",
      description: "So'z boyligi bo'yicha tezkor bellashuv",
      subject: "Ingliz tili",
      type: "SPEED",
      countsToRating: true,
    },
  });
  const q2Questions: Array<[string, string[], number, number]> = [
    ["'Kitob' so'zining inglizcha tarjimasi?", ["Book", "Pen", "Desk", "Bag"], 0, 10],
    ["'Beautiful' so'zining ma'nosi?", ["Xunuk", "Go'zal", "Katta", "Kichik"], 1, 10],
    ["Qaysi so'z 'yugurmoq' degani?", ["Walk", "Jump", "Run", "Swim"], 2, 10],
    ["'Apple' nima?", ["Nok", "Olma", "Uzum"], 1, 10],
    ["To'g'ri yozilgan so'zni tanlang", ["Recieve", "Receive"], 1, 15],
    ["'Quickly' qanday so'z turkumi?", ["Ot", "Fe'l", "Ravish", "Sifat"], 2, 15],
  ];
  for (let i = 0; i < q2Questions.length; i++) {
    await db.quizQuestion.create({
      data: {
        quizId: quiz2.id,
        order: i,
        text: q2Questions[i][0],
        options: JSON.stringify(q2Questions[i][1]),
        correctIndex: q2Questions[i][2],
        timeSeconds: q2Questions[i][3],
        points: 500,
      },
    });
  }

  // O'tkazilgan quiz natijalari (3 kun oldin)
  const quizPlayers = [0, 1, 2, 3, 4, 5];
  const sortedByScore = quizPlayers
    .map((si) => ({ si, score: 3000 + Math.floor(rand() * 5000) }))
    .sort((a, b) => b.score - a.score);
  for (let place = 0; place < sortedByScore.length; place++) {
    const { si, score } = sortedByScore[place];
    const xpEarned = Math.round(score * 0.05);
    const pointsEarned = Math.round(score * 0.015);
    await db.quizResult.create({
      data: {
        quizId: quiz1.id,
        studentId: students[si].id,
        pin: "482913",
        score,
        correctCount: 5 + Math.floor(rand() * 3),
        wrongCount: Math.floor(rand() * 3),
        bestStreak: 2 + Math.floor(rand() * 5),
        fastestMs: 1200 + Math.floor(rand() * 3000),
        place: place + 1,
        xpEarned,
        pointsEarned,
        createdAt: daysAgo(3),
      },
    });
    txs.push({
      studentId: students[si].id,
      points: pointsEarned,
      xp: xpEarned,
      reason: `Quiz: Kompyuter asoslari (${place + 1}-o'rin)`,
      sourceType: "QUIZ",
      createdAt: daysAgo(3),
    });
  }

  console.log("Yutuqlar...");
  const achievementDefs = [
    { code: "STREAK_7", name: "Olov seriyasi", description: "7 kun ketma-ket faol bo'lish", icon: "🔥", xpReward: 100, pointsReward: 50 },
    { code: "HOMEWORK_10_ONTIME", name: "Mas'uliyatli o'quvchi", description: "10 ta vazifani o'z vaqtida bajarish", icon: "📚", xpReward: 150, pointsReward: 75 },
    { code: "EARLY_5", name: "Ilg'or", description: "5 ta vazifani muddatidan oldin topshirish", icon: "⚡", xpReward: 120, pointsReward: 60 },
    { code: "QUIZ_WINNER", name: "Quiz chempioni", description: "Quizda 1-o'rin olish", icon: "🏆", xpReward: 200, pointsReward: 100 },
    { code: "TOP3_GROUP", name: "Yulduz", description: "Guruh reytingida TOP 3 ga kirish", icon: "⭐", xpReward: 150, pointsReward: 75 },
    { code: "EXAM_PERFECT", name: "Mukammal natija", description: "Imtihondan 100% natija olish", icon: "💯", xpReward: 250, pointsReward: 125 },
    { code: "MONTH_CHAMPION", name: "Oy chempioni", description: "Oylik reytingda 1-o'rin", icon: "👑", xpReward: 300, pointsReward: 150 },
  ];
  const achievements: Record<string, string> = {};
  for (const a of achievementDefs) {
    const created = await db.achievement.create({ data: a });
    achievements[a.code] = created.id;
  }
  const grants: Array<[number, string, number]> = [
    [0, "QUIZ_WINNER", 3],
    [0, "EXAM_PERFECT", 10],
    [0, "TOP3_GROUP", 8],
    [1, "TOP3_GROUP", 6],
    [2, "STREAK_7", 4],
    [4, "EARLY_5", 5],
  ];
  for (const [si, code, back] of grants) {
    await db.studentAchievement.create({
      data: {
        studentId: students[si].id,
        achievementId: achievements[code],
        earnedAt: daysAgo(back),
      },
    });
    const def = achievementDefs.find((a) => a.code === code)!;
    txs.push({
      studentId: students[si].id,
      points: def.pointsReward,
      xp: def.xpReward,
      reason: `Yutuq: ${def.name}`,
      sourceType: "ACHIEVEMENT",
      createdAt: daysAgo(back),
    });
  }

  console.log("Tranzaksiyalar va balanslar...");
  for (const t of txs) {
    await db.scoreTransaction.create({ data: t });
  }
  // foydalanuvchi balanslari = tranzaksiyalar yig'indisi
  const totals = new Map<string, { points: number; xp: number }>();
  for (const t of txs) {
    const cur = totals.get(t.studentId) ?? { points: 0, xp: 0 };
    cur.points += t.points;
    cur.xp += Math.max(0, t.xp);
    totals.set(t.studentId, cur);
  }
  for (const [studentId, sum] of totals) {
    await db.user.update({
      where: { id: studentId },
      data: {
        points: sum.points,
        xp: sum.xp,
        streak: 1 + Math.floor(rand() * 9),
        lastActive: new Date(),
      },
    });
  }

  console.log("Bildirishnomalar...");
  const n1 = await db.notification.create({
    data: {
      title: "Yangi o'quv yili boshlanishi",
      body: "Hurmatli o'quvchilar! 15-sentabrdan yangi o'quv mavsumi boshlanadi. Darslar jadvalini kabinetingizda ko'rishingiz mumkin.",
      senderId: superAdmin.id,
      audience: "ALL_STUDENTS",
      status: "SENT",
      sentAt: daysAgo(4),
    },
  });
  for (const s of students) {
    await db.notificationRecipient.create({
      data: { notificationId: n1.id, userId: s.id, readAt: rand() < 0.5 ? daysAgo(2) : null },
    });
  }
  const n2 = await db.notification.create({
    data: {
      title: "Frontend A-1: dars vaqti o'zgarishi",
      body: "Juma kungi dars 14:00 o'rniga 15:00 da boshlanadi.",
      senderId: superAdmin.id,
      audience: "GROUP",
      groupId: groups[0].id,
      status: "SENT",
      sentAt: daysAgo(1),
    },
  });
  for (const si of membership[0]) {
    await db.notificationRecipient.create({
      data: { notificationId: n2.id, userId: students[si].id },
    });
  }
  await db.notification.create({
    data: {
      title: "Oylik test natijalari",
      body: "Oylik test natijalari e'lon qilinadi. Barchaga omad!",
      senderId: superAdmin.id,
      audience: "ALL_STUDENTS",
      status: "SCHEDULED",
      scheduledAt: new Date(Date.now() + 2 * 86_400_000),
    },
  });

  console.log("Qo'ng'iroqlar tarixi...");
  const todayAbsent = attendanceRows.filter((a) => a.date === dateStr(new Date()) && a.status === "ABSENT");
  let first = true;
  for (const a of todayAbsent.slice(0, 3)) {
    await db.callLog.create({
      data: {
        studentId: a.studentId,
        groupId: a.groupId,
        date: a.date,
        status: first ? "TALKED" : "NOT_CALLED",
        note: first ? "Ota-onasi bilan gaplashildi, ertaga keladi" : undefined,
        calledById: first ? superAdmin.id : undefined,
      },
    });
    first = false;
  }

  console.log("Sozlamalar va jurnal...");
  await db.setting.createMany({
    data: [
      { key: "quiz_xp_rate", value: "0.05" },
      { key: "quiz_point_rate", value: "0.015" },
    ],
  });
  const activities = [
    [superAdmin.id, "Tizimga kirdi", null],
    [teachers[0].id, "Davomat belgiladi", "Frontend A-1"],
    [teachers[1].id, "Uyga vazifa yaratdi", "Ingliz tili C-1: mustaqil ish"],
    [students[0].id, "Vazifa topshirdi", "Frontend A-1: mustaqil ish"],
    [superAdmin.id, "Bildirishnoma yubordi", "Frontend A-1: dars vaqti o'zgarishi"],
    [teachers[0].id, "Quiz o'tkazdi", "Kompyuter asoslari"],
  ] as const;
  for (let i = 0; i < activities.length; i++) {
    await db.activityLog.create({
      data: {
        userId: activities[i][0],
        action: activities[i][1],
        detail: activities[i][2],
        createdAt: new Date(Date.now() - i * 3 * 3600_000),
      },
    });
  }

  console.log("✅ Seed tugadi.");
  console.log("Kirish ma'lumotlari:");
  console.log("  Super Admin:  admin / admin123");
  console.log("  Administrator: manager / admin123");
  console.log("  O'qituvchi:   aziz.teacher / teacher123 (yoki madina/jasur/dilnoza.teacher)");
  console.log("  O'quvchi:     student1 ... student20 / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
