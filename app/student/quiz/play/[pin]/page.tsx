// O'quvchi o'yin ekrani (server wrapper): o'yin mavjudligini tekshiradi
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getGame } from "@/lib/quiz-live";
import { PlayClient } from "./play-client";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ pin: string }>;
}) {
  await requireRole("STUDENT");
  const { pin } = await params;

  const game = getGame(pin);
  if (!game) redirect("/student/quiz?error=notfound");

  return <PlayClient pin={pin} quizName={game.quiz.name} />;
}
