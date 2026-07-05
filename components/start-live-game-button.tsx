"use client";

import { requestFullscreen } from "@/lib/fullscreen";
import { startLiveGame } from "@/app/teacher/quizzes/actions";

export function StartLiveGameButton({
  quizId,
  className,
  children,
  disabled,
}: {
  quizId: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <form action={startLiveGame}>
      <input type="hidden" name="quizId" value={quizId} />
      <button
        type="submit"
        className={className}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          void requestFullscreen().catch(() => {});
        }}
      >
        {children}
      </button>
    </form>
  );
}
