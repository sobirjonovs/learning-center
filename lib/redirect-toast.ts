import { redirect } from "next/navigation";

function withToastParam(path: string, key: "toast" | "toastError", message: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${key}=${encodeURIComponent(message)}`;
}

/** Muvaffaqiyat toasti bilan yo'naltirish. */
export function redirectWithToast(path: string, message: string): never {
  redirect(withToastParam(path, "toast", message));
}

/** Xato toasti bilan yo'naltirish. */
export function redirectWithError(path: string, message: string): never {
  redirect(withToastParam(path, "toastError", message));
}
