import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readUploadFile } from "@/lib/uploads";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const data = await readUploadFile(segments);
  if (!data) return new NextResponse("Topilmadi", { status: 404 });

  const ext = path.extname(segments.at(-1) ?? "").toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
