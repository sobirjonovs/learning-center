import { db } from "@/lib/db";

/** F.I.Sh dan faqat ismni oladi (masalan: Aziz Rahimov → aziz) */
export function firstNameFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeNamePart)
    .filter(Boolean);

  return parts[0] ?? "";
}

function normalizeNamePart(part: string): string {
  return part
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/o[''`ʻʼ]/g, "o")
    .replace(/g[''`ʻʼ]/g, "g")
    .replace(/[^a-z0-9]/g, "");
}

/** Ismdan oson login yaratadi (masalan: Aziz → aziz_U121) */
export async function generateUniqueLogin(
  name: string,
  excludeUserId?: string
): Promise<string> {
  const first = firstNameFromName(name);
  if (!first) return "";

  for (let i = 0; i < 40; i++) {
    const num = Math.floor(100 + Math.random() * 900);
    const candidate = `${first}_U${num}`;
    if (!(await loginTaken(candidate, excludeUserId))) return candidate;
  }

  for (let n = 100; n < 10000; n++) {
    const candidate = `${first}_U${n}`;
    if (!(await loginTaken(candidate, excludeUserId))) return candidate;
  }

  return "";
}

async function loginTaken(login: string, excludeUserId?: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { login }, select: { id: true } });
  if (!user) return false;
  if (excludeUserId && user.id === excludeUserId) return false;
  return true;
}
