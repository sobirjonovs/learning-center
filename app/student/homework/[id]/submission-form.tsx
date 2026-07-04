"use client";

// Vazifa topshirish formasi — havola YOKI fayl (kamida bittasi shart)
import { useActionState } from "react";
import { submitHomework, type SubmitHomeworkState } from "../actions";
import { Label, inputCls } from "@/components/ui";

const submitBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50";

export function SubmissionForm({
  homeworkId,
  resubmit,
}: {
  homeworkId: string;
  resubmit?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SubmitHomeworkState, FormData>(
    submitHomework,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="homeworkId" value={homeworkId} />

      <div>
        <Label htmlFor="link">Havola (link)</Label>
        <input
          id="link"
          name="link"
          type="url"
          placeholder="https://github.com/..."
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

      <div>
        <Label htmlFor="comment">Izoh (ixtiyoriy)</Label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          placeholder="O'qituvchiga qo'shimcha izoh..."
          className={inputCls}
        />
      </div>

      {state.error && (
        <div className="animate-shake rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {state.error}
        </div>
      )}

      <button type="submit" disabled={pending} className={submitBtn}>
        {pending ? "Yuborilmoqda..." : resubmit ? "🔄 Qayta topshirish" : "🚀 Topshirish"}
      </button>
    </form>
  );
}
