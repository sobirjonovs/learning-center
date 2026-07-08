// Rejalashtirilgan yutuqlarni qo'lda ishga tushirish (curl kerak emas).
import { processScheduledAchievements } from "../lib/achievement-scheduler";

async function main() {
  const result = await processScheduledAchievements();
  console.log(JSON.stringify({ ok: true, result }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
