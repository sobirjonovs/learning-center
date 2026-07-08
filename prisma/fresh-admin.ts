// Barcha ma'lumotlarni o'chirib, faqat super admin yaratadi.
// Production: CONFIRM_FRESH=true npm run db:fresh
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function clearAll() {
  console.log("Barcha ma'lumotlar o'chirilmoqda...");
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
  await db.teacherSubject.deleteMany();
  await db.group.deleteMany();
  await db.subject.deleteMany();
  await db.studentPayment.deleteMany();
  await db.subjectPrice.deleteMany();
  await db.setting.deleteMany();
  await db.user.deleteMany();
}

async function createAdmin() {
  const login = process.env.ADMIN_LOGIN ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const name = process.env.ADMIN_NAME ?? "Administrator";

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      role: "SUPER_ADMIN",
      name,
      login,
      password: passwordHash,
      permissions: JSON.stringify([]),
    },
  });

  console.log("✅ Super admin yaratildi.");
  console.log(`   Login:  ${login}`);
  console.log(`   Parol:  ${password}`);
  console.log("⚠️  Parolni darhol o'zgartiring!");
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.CONFIRM_FRESH !== "true") {
    console.error("❌ Productionda barcha ma'lumot o'chiriladi!");
    console.error("   Ishga tushirish: CONFIRM_FRESH=true npm run db:fresh");
    process.exit(1);
  }

  await clearAll();
  await createAdmin();
  console.log("✅ Baza tozalandi va admin tayyor.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
