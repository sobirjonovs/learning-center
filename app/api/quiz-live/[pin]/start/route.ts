// Host o'yinni boshlaydi
import { getSession } from "@/lib/auth";
import { getGame, start } from "@/lib/quiz-live";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const session = await getSession();
  if (!session || session.role !== "TEACHER") {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  const game = getGame(pin);
  if (!game) return Response.json({ error: "O'yin topilmadi" }, { status: 404 });
  if (game.hostId !== session.id) {
    return Response.json({ error: "Bu o'yin sizniki emas" }, { status: 403 });
  }

  const result = start(pin, session.id);
  if (result.error) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
