"use client";

import { useEffect, useRef } from "react";
import { exitFullscreen, isFullscreenActive, requestFullscreen } from "@/lib/fullscreen";

const CLASS = "quiz-immersive";

/** Shell (sidebar/header) yashirish va ixtiyoriy brauzer fullscreen. */
export function useQuizImmersive(active: boolean, browserFullscreen = true) {
  const enteredRef = useRef(false);

  useEffect(() => {
    if (!active) {
      document.documentElement.classList.remove(CLASS);
      return;
    }
    enteredRef.current = true;
    document.documentElement.classList.add(CLASS);
    if (browserFullscreen) {
      void requestFullscreen().catch(() => {});
    }
    return () => {
      document.documentElement.classList.remove(CLASS);
    };
  }, [active, browserFullscreen]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove(CLASS);
      if (enteredRef.current && isFullscreenActive()) {
        void exitFullscreen().catch(() => {});
      }
    };
  }, []);
}
