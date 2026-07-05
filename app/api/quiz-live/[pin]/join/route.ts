// O'quvchi o'yinga qo'shiladi: { avatar }
import { getSession } from "@/lib/auth";
import {
  DEFAULT_QUIZ_AVATAR,
  DEFAULT_QUIZ_FACE,
  encodeQuizAvatar,
  isValidQuizAvatar,
  parseQuizAvatar,
} from "@/lib/quiz-avatars";
import { join } from "@/lib/quiz-live";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return Response.json({ error: "Faqat o'quvchilar qo'shila oladi" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const raw =
    typeof body?.avatar === "string"
      ? body.avatar
      : typeof body?.emoji === "string"
        ? body.emoji
        : DEFAULT_QUIZ_AVATAR;

  const parsed = parseQuizAvatar(isValidQuizAvatar(raw) ? raw : DEFAULT_QUIZ_AVATAR);
  const avatar = parsed.body
    ? encodeQuizAvatar(parsed.body, DEFAULT_QUIZ_FACE)
    : DEFAULT_QUIZ_AVATAR;

  const result = join(pin, { id: session.id, name: session.name }, avatar);
  if (result.error) {
    const status = result.error === "O'yin topilmadi" ? 404 : 400;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ ok: true });
}
