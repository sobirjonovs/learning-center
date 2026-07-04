// O'quvchi o'yinga qo'shiladi: { emoji }
import { getSession } from "@/lib/auth";
import { EMOJI_AVATARS } from "@/lib/constants";
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
  const emoji =
    typeof body?.emoji === "string" && EMOJI_AVATARS.includes(body.emoji)
      ? body.emoji
      : EMOJI_AVATARS[0];

  const result = join(pin, { id: session.id, name: session.name }, emoji);
  if (result.error) {
    const status = result.error === "O'yin topilmadi" ? 404 : 400;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ ok: true });
}
