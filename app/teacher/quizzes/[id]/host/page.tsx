// Jonli o'yin host ekrani (server wrapper)
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGame } from "@/lib/quiz-live";
import { HostClient } from "./host-client";

export default async function HostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pin?: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const { pin } = await searchParams;

  const quiz = await db.quiz.findUnique({ where: { id }, select: { teacherId: true } });
  if (!quiz || quiz.teacherId !== session.id) redirect("/teacher/quizzes");

  const game = pin ? getGame(pin) : undefined;
  if (!pin || !game || game.hostId !== session.id || game.quizId !== id) {
    redirect(`/teacher/quizzes/${id}`);
  }

  return <HostClient pin={pin} quizId={id} />;
}
