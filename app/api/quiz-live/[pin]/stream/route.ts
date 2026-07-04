// SSE oqimi: host to'liq ko'rinishni, o'quvchi o'z ko'rinishini oladi.
import { getSession } from "@/lib/auth";
import { getGame, hostView, playerView, subscribe, type Game } from "@/lib/quiz-live";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });
  }
  const game = getGame(pin);
  if (!game) {
    return Response.json({ error: "O'yin topilmadi" }, { status: 404 });
  }

  const isHost = game.hostId === session.id;
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
      };

      const push = (g: Game) => {
        if (closed) return;
        const view = isHost ? hostView(g) : playerView(g, session.id);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(view)}\n\n`));
        } catch {
          cleanup();
        }
      };

      push(game); // ulanish zahoti joriy holat
      unsubscribe = subscribe(pin, push);

      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          cleanup();
        }
      }, 15_000);

      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // allaqachon yopilgan
        }
      });
    },
    cancel() {
      closed = true;
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
