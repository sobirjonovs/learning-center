"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import type { ExamResultStatus } from "@/lib/constants";
import { EXAM_RESULT_STATUS } from "@/lib/constants";
import { fmtDateTime, pct } from "@/lib/utils";
import { Avatar, Badge, Card, Field, btn, inputCls } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { gradeExamResult, type GradeExamState } from "../actions";

type ResultData = {
  id: string;
  link: string | null;
  fileUrl: string | null;
  comment: string | null;
  submittedAt: Date | null;
  status: string;
  score: number | null;
  passed: boolean | null;
  feedback: string | null;
};

type StudentData = {
  id: string;
  name: string;
  image: string | null;
};

function fileLabel(url: string): string {
  const name = url.split("/").pop() ?? "fayl";
  return decodeURIComponent(name);
}

function openFile(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function ExamSubmissionCard({
  student,
  result,
  minScore,
  maxScore,
  passPercent,
}: {
  student: StudentData;
  result: ResultData;
  minScore: number;
  maxScore: number;
  passPercent: number;
}) {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const fileOpened = useRef(false);
  const [state, formAction, pending] = useActionState<GradeExamState, FormData>(gradeExamResult, {});

  const status = (
    result.status in EXAM_RESULT_STATUS ? result.status : "SUBMITTED"
  ) as ExamResultStatus;
  const needsReview = status === "SUBMITTED" || status === "RETURNED";
  const hasFile = Boolean(result.fileUrl);

  useEffect(() => {
    if (state.success) toast({ type: "success", message: state.success });
    if (state.error) toast({ type: "error", message: state.error });
  }, [state, toast]);

  const startReview = () => {
    setReviewing(true);
    if (result.fileUrl && !fileOpened.current) {
      fileOpened.current = true;
      openFile(result.fileUrl);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} image={student.image} size="sm" />
          <div>
            <div className="text-sm font-semibold text-slate-100">{student.name}</div>
            {result.submittedAt && (
              <div className="text-xs text-slate-400">{fmtDateTime(result.submittedAt)}</div>
            )}
          </div>
        </div>
        <Badge className={EXAM_RESULT_STATUS[status].badge}>{EXAM_RESULT_STATUS[status].label}</Badge>
      </div>

      {(result.link || result.fileUrl || result.comment) && (
        <div className="mt-3 space-y-2 rounded-xl bg-white/5 p-3 text-sm">
          {result.link && (
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 truncate font-medium text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {result.link}
            </a>
          )}
          {result.fileUrl && (
            <button
              type="button"
              onClick={() => openFile(result.fileUrl!)}
              className="flex w-full items-center gap-2 text-left font-medium text-blue-400 hover:underline"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              {fileLabel(result.fileUrl)}
            </button>
          )}
          {result.comment && (
            <p className="whitespace-pre-line text-slate-300">{result.comment}</p>
          )}
        </div>
      )}

      {result.status === "ACCEPTED" && result.score !== null && (
        <div
          className={`mt-3 rounded-xl p-3 text-sm ${
            result.passed
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-rose-500/10 text-rose-300"
          }`}
        >
          Ball: <span className="font-bold">{result.score}</span> / {maxScore} (
          {pct(result.score, maxScore)}%) —{" "}
          <span className="font-semibold">{result.passed ? "O'tdi" : "Yiqildi"}</span>
          <span className="mt-1 block text-xs opacity-80">O'tish chegara: {passPercent}%</span>
        </div>
      )}

      {needsReview && !reviewing && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <button type="button" onClick={startReview} className={btn.primary}>
            {hasFile ? "Faylni ochib tekshirish" : "Tekshirish"}
          </button>
        </div>
      )}

      {(reviewing || !needsReview) && (
        <form action={formAction} className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <input type="hidden" name="resultId" value={result.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Ball (${minScore}-${maxScore})`}>
              <input
                type="number"
                name="score"
                min={minScore}
                max={maxScore}
                defaultValue={result.score ?? ""}
                placeholder={String(maxScore)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Izoh">
              <textarea
                name="feedback"
                rows={1}
                defaultValue={result.feedback ?? ""}
                placeholder="O'quvchiga izoh..."
                className={inputCls}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="decision" value="ACCEPT" disabled={pending} className={btn.primary}>
              {pending ? "Kutilmoqda..." : "Tasdiqlash va baholash"}
            </button>
            <button type="submit" name="decision" value="RETURN" disabled={pending} className={btn.secondary}>
              Qayta ishlashga yuborish
            </button>
            {hasFile && (
              <button type="button" onClick={() => openFile(result.fileUrl!)} className={btn.secondary}>
                Faylni qayta ochish
              </button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
