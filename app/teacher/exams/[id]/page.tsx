// Imtihon topshiriqlarini tekshirish sahifasi
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { Hourglass, Inbox, Target, Users } from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  PageHeader,
  StatCard,
  btn,
} from "@/components/ui";
import { ExamSubmissionCard } from "./exam-submission-card";

export default async function ExamGradingPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    include: {
      group: {
        include: {
          students: {
            include: { student: { select: { id: true, name: true, image: true } } },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
      results: true,
    },
  });
  if (!exam || exam.group.teacherId !== session.id) redirect("/teacher/exams");

  const resultByStudent = new Map(exam.results.map((r) => [r.studentId, r]));
  const submittedCount = exam.results.length;
  const ungradedCount = exam.results.filter((r) => r.status === "SUBMITTED").length;
  const passedCount = exam.results.filter((r) => r.status === "ACCEPTED" && r.passed).length;

  return (
    <div>
      <PageHeader
        title={exam.title}
        subtitle={`${exam.group.name} · ${fmtDateTime(exam.startAt)} — ${fmtDateTime(exam.endAt)}`}
        backHref="/teacher/exams"
        action={
          <Link href={`/teacher/exams/${exam.id}/edit`} className={btn.secondary}>
            Tahrirlash
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ball oralig'i"
          value={`${exam.minScore}–${exam.maxScore}`}
          icon={Target}
          tone="indigo"
          hint={`O'tish: ${exam.passPercent}%`}
        />
        <StatCard
          label="Topshirdi"
          value={`${submittedCount}/${exam.group.students.length}`}
          icon={Inbox}
          tone="sky"
        />
        <StatCard label="Tekshirilmagan" value={ungradedCount} icon={Hourglass} tone="amber" />
        <StatCard label="O'tganlar" value={passedCount} icon={Users} tone="emerald" />
      </div>

      {(exam.description || exam.imageUrl || exam.fileUrl || exam.link) && (
        <Card className="mb-6">
          {exam.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exam.imageUrl}
              alt=""
              className="mb-4 max-h-48 rounded-xl border border-white/10 object-cover"
            />
          )}
          {exam.description && (
            <p className="whitespace-pre-line text-sm text-slate-300">{exam.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {exam.fileUrl && (
              <a href={exam.fileUrl} target="_blank" className="font-medium text-blue-400 hover:underline">
                📎 Imtihon fayli
              </a>
            )}
            {exam.link && (
              <a href={exam.link} target="_blank" className="font-medium text-blue-400 hover:underline">
                🔗 Imtihon havolasi
              </a>
            )}
          </div>
        </Card>
      )}

      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        O&apos;quvchilar topshiriqlari ({exam.group.students.length})
      </h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {exam.group.students.map((m) => {
          const result = resultByStudent.get(m.student.id);
          if (!result) {
            return (
              <Card key={m.student.id} className="bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.student.name} image={m.student.image} size="sm" />
                    <span className="text-sm font-medium text-slate-500">{m.student.name}</span>
                  </div>
                  <Badge className="bg-slate-200 text-slate-500">Topshirmagan</Badge>
                </div>
              </Card>
            );
          }

          return (
            <ExamSubmissionCard
              key={m.student.id}
              student={m.student}
              result={result}
              minScore={exam.minScore}
              maxScore={exam.maxScore}
              passPercent={exam.passPercent}
            />
          );
        })}
      </div>
    </div>
  );
}
