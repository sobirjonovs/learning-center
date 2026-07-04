import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * Yuklangan faylni public/uploads/<folder> ichiga saqlaydi.
 * Bo'sh fayl uchun null qaytaradi. Natija: "/uploads/<folder>/<nom>"
 */
export async function saveUpload(
  file: File | null | undefined,
  folder: string
): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Fayl hajmi 10MB dan oshmasligi kerak");
  }
  const ext = path.extname(file.name || "").slice(0, 10).toLowerCase();
  const name = `${crypto.randomBytes(8).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}
