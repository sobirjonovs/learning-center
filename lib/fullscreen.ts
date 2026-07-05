// Brauzer to'liq ekran rejimi (Quiz Battle / Kahoot uslubi)

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
};

export function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as FullscreenElement;
  return !!(
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.msRequestFullscreen
  );
}

export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument;
  return !!(
    document.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.msFullscreenElement
  );
}

export function requestFullscreen(el?: HTMLElement | null): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const target = (el ?? document.documentElement) as FullscreenElement;
  if (target.requestFullscreen) return target.requestFullscreen();
  if (target.webkitRequestFullscreen) return target.webkitRequestFullscreen();
  if (target.msRequestFullscreen) return target.msRequestFullscreen();
  return Promise.reject(new Error("Fullscreen qo'llab-quvvatlanmaydi"));
}

export function exitFullscreen(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const doc = document as FullscreenDocument;
  if (document.exitFullscreen) return document.exitFullscreen();
  if (doc.webkitExitFullscreen) return doc.webkitExitFullscreen();
  if (doc.msExitFullscreen) return doc.msExitFullscreen();
  return Promise.resolve();
}
