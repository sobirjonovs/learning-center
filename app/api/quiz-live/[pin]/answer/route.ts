// O'quvchi javobi: { option }
import { getSession } from "@/lib/auth";
import { answer } from "@/lib/quiz-live";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const session = await getSession();
  if (!session || session.role !== "STUDENT") {
    return Response.json({ error: "Faqat o'quvchilar javob bera oladi" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const option = Number(body?.option);

  const result = answer(pin, session.id, option);
  if (result.error) {
    const status = result.error === "O'yin topilmadi" ? 404 : 400;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ ok: true });
}
