import { access, mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

/** Yuklangan fayllar saqlanadigan papka (Railway volume uchun UPLOAD_DIR o'rnating). */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || path.join(process.cwd(), "uploads");
}

/** /uploads/<folder>/<file> yo'lidan diskdagi to'liq manzil */
export function resolveUploadPath(segments: string[]): string | null {
  const safe = segments.filter((s) => s && s !== "." && s !== ".." && !s.includes("\0"));
  if (!safe.length || safe.length !== segments.length) return null;
  return path.join(getUploadDir(), ...safe);
}

/** Eski lokal yuklamalar (public/uploads) uchun zaxira */
export function resolveLegacyUploadPath(segments: string[]): string | null {
  const safe = segments.filter((s) => s && s !== "." && s !== ".." && !s.includes("\0"));
  if (!safe.length || safe.length !== segments.length) return null;
  return path.join(process.cwd(), "public", "uploads", ...safe);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Yuklangan faylni diskka saqlaydi. Natija: "/uploads/<folder>/<nom>" */
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
  const dir = path.join(getUploadDir(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}

export async function readUploadFile(segments: string[]): Promise<Buffer | null> {
  const primary = resolveUploadPath(segments);
  if (primary && (await fileExists(primary))) {
    const { readFile } = await import("fs/promises");
    return readFile(primary);
  }
  const legacy = resolveLegacyUploadPath(segments);
  if (legacy && (await fileExists(legacy))) {
    const { readFile } = await import("fs/promises");
    return readFile(legacy);
  }
  return null;
}

/** Rasm havolasini tekshiradi: http(s) yoki lokal /uploads/... yo'llar */
export function normalizeImageUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {
    return null;
  }
  return null;
}

/**
 * Formadan rasmni o'qiydi: avval fayl yuklash, bo'lmasa havola.
 * Ikkalasi bo'sh bo'lsa null qaytaradi.
 */
export async function resolveImageFromForm(
  formData: FormData,
  folder: string,
  options?: { fileField?: string; urlField?: string }
): Promise<string | null> {
  const fileField = options?.fileField ?? "image";
  const urlField = options?.urlField ?? "imageUrl";

  const uploaded = await saveUpload(formData.get(fileField) as File | null, folder);
  if (uploaded) return uploaded;

  const urlRaw = String(formData.get(urlField) ?? "").trim();
  if (!urlRaw) return null;

  return normalizeImageUrl(urlRaw);
}
