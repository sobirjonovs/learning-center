"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import type { SubmissionStatus } from "@/lib/constants";
import { SUBMISSION_STATUS } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";
import { computeHomeworkScore } from "@/lib/gamification";
import { Avatar, Badge, Card, Field, btn, inputCls } from "@/components/ui";
import { useToast } from "@/components/toast-provider";
import { gradeSubmission, type GradeState } from "../actions";

type SubmissionData = {
  id: string;
  link: string | null;
  fileUrl: string | null;
  comment: string | null;
  submittedAt: Date;
  status: string;
  baseScore: number | null;
  bonus: number;
  penalty: number;
  score: number | null;
  feedback: string | null;
};

type StudentData = {
  id: string;
  name: string;
  image: string | null;
};

function timingInfo(daysEarly: number, daysLate: number): { text: string; cls: string } {
  if (daysEarly > 0)
    return { text: `${daysEarly} kun oldin topshirdi`, cls: "text-emerald-600" };
  if (daysLate > 0)
    return { text: `${daysLate} kun kechikib topshirdi`, cls: "text-rose-600" };
  return { text: "O'z vaqtida topshirdi", cls: "text-slate-500" };
}

function fileLabel(url: string): string {
  const name = url.split("/").pop() ?? "fayl";
  return decodeURIComponent(name);
}

function openFile(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function SubmissionCard({
  student,
  submission,
  maxScore,
  dueAt,
  earlyBonus,
  latePenalty,
}: {
  student: StudentData;
  submission: SubmissionData;
  maxScore: number;
  dueAt: Date;
  earlyBonus: number;
  latePenalty: number;
}) {
  const { toast } = useToast();
  const [reviewing, setReviewing] = useState(false);
  const fileOpened = useRef(false);
  const [state, formAction, pending] = useActionState<GradeState, FormData>(gradeSubmission, {});

  const status = (
    submission.status in SUBMISSION_STATUS ? submission.status : "SUBMITTED"
  ) as SubmissionStatus;
  const defaultBase = submission.baseScore ?? maxScore;
  const preview = computeHomeworkScore(
    defaultBase,
    dueAt,
    submission.submittedAt,
    earlyBonus,
    latePenalty
  );
  const timing = timingInfo(preview.daysEarly, preview.daysLate);
  const needsReview = status === "SUBMITTED" || status === "RETURNED";
  const hasFile = Boolean(submission.fileUrl);

  useEffect(() => {
    if (state.success) toast({ type: "success", message: state.success });
    if (state.error) toast({ type: "error", message: state.error });
  }, [state, toast]);

  const startReview = () => {
    setReviewing(true);
    if (submission.fileUrl && !fileOpened.current) {
      fileOpened.current = true;
      openFile(submission.fileUrl);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} image={student.image} size="sm" />
          <div>
            <div className="text-sm font-semibold text-slate-100">{student.name}</div>
            <div className="text-xs text-slate-400">
              {fmtDateTime(submission.submittedAt)} · <span className={timing.cls}>{timing.text}</span>
            </div>
          </div>
        </div>
        <Badge className={SUBMISSION_STATUS[status].badge}>{SUBMISSION_STATUS[status].label}</Badge>
      </div>

      {(submission.link || submission.fileUrl || submission.comment) && (
        <div className="mt-3 space-y-2 rounded-xl bg-white/5 p-3 text-sm">
          {submission.link && (
            <a
              href={submission.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 truncate font-medium text-blue-400 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {submission.link}
            </a>
          )}
          {submission.fileUrl && (
            <button
              type="button"
              onClick={() => openFile(submission.fileUrl!)}
              className="flex w-full items-center gap-2 text-left font-medium text-blue-400 hover:underline"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              {fileLabel(submission.fileUrl)}
            </button>
          )}
          {submission.comment && <p className="text-slate-600">💬 {submission.comment}</p>}
        </div>
      )}

      {submission.status === "ACCEPTED" && submission.score !== null && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          Asosiy: {submission.baseScore ?? 0}, Bonus: +{submission.bonus}, Jarima: -{submission.penalty},{" "}
          Yakuniy: <span className="font-bold">{submission.score}</span> / {maxScore}
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
          <input type="hidden" name="submissionId" value={submission.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Ball (0-${maxScore})`}>
              <input
                type="number"
                name="base"
                min={0}
                max={maxScore}
                defaultValue={submission.baseScore ?? ""}
                placeholder={String(maxScore)}
                className={inputCls}
                required
              />
            </Field>
            <Field label="Izoh">
              <textarea
                name="feedback"
                rows={1}
                defaultValue={submission.feedback ?? ""}
                placeholder="O'quvchiga izoh..."
                className={inputCls}
              />
            </Field>
          </div>
          <p className="text-xs text-slate-400">
            Hisob-kitob: Asosiy: {preview.base}, Bonus: +{preview.bonus}, Jarima: -{preview.penalty},
            Yakuniy: {preview.final}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="decision" value="ACCEPT" disabled={pending} className={btn.primary}>
              {pending ? "Kutilmoqda..." : "Qabul qilish"}
            </button>
            <button type="submit" name="decision" value="RETURN" disabled={pending} className={btn.secondary}>
              Qayta ishlashga yuborish
            </button>
            {hasFile && (
              <button
                type="button"
                onClick={() => openFile(submission.fileUrl!)}
                className={btn.secondary}
              >
                Faylni qayta ochish
              </button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
