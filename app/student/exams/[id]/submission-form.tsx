"use client";

import { useActionState } from "react";
import { RotateCcw, Send } from "lucide-react";
import { submitExam, type SubmitExamState } from "../actions";
import { Label, inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";
import { gameBtn } from "@/components/gamification";

const submitBtn = cn(gameBtn, "w-full py-2.5");

export function ExamSubmissionForm({
  examId,
  resubmit,
}: {
  examId: string;
  resubmit?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SubmitExamState, FormData>(submitExam, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="examId" value={examId} />

      <div>
        <Label htmlFor="comment">Batafsil javob *</Label>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          required
          placeholder="Imtihon javobingiz, izoh va tushuntirishlar..."
          className={inputCls}
        />
      </div>

      <div>
        <Label htmlFor="link">Havola (link)</Label>
        <input
          id="link"
          name="link"
          type="url"
          placeholder="https://..."
          className={inputCls}
        />
      </div>

      <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        YOKI
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div>
        <Label htmlFor="file">Fayl (maks. 10MB)</Label>
        <input id="file" name="file" type="file" className={inputCls} />
      </div>

      <p className="text-xs text-slate-400">
        Batafsil javob majburiy. Qoʻshimcha ravishda havola yoki fayl biriktiring.
      </p>

      {state.error && (
        <div className="animate-shake rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={pending} className={submitBtn}>
        {pending ? (
          "Yuborilmoqda..."
        ) : resubmit ? (
          <>
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            Qayta topshirish
          </>
        ) : (
          <>
            <Send className="h-4 w-4" strokeWidth={1.75} />
            Topshirish
          </>
        )}
      </button>
    </form>
  );
}
