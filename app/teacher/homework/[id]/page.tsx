// Uyga vazifani tekshirish (baholash) sahifasi
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/utils";
import { Hourglass, Inbox, Scale, Target } from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  PageHeader,
  StatCard,
  btn,
} from "@/components/ui";
import { SubmissionCard } from "./submission-card";

export default async function HomeworkGradingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;

  const hw = await db.homework.findUnique({
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
      submissions: true,
    },
  });
  if (!hw || hw.group.teacherId !== session.id) redirect("/teacher/homework");

  const subByStudent = new Map(hw.submissions.map((s) => [s.studentId, s]));
  const submittedCount = hw.submissions.length;
  const ungradedCount = hw.submissions.filter((s) => s.status === "SUBMITTED").length;

  return (
    <div>
      <PageHeader
        title={hw.title}
        subtitle={`${hw.group.name} · Muddat: ${fmtDateTime(hw.dueAt)}`}
        backHref="/teacher/homework"
        action={
          <Link href={`/teacher/homework/${hw.id}/edit`} className={btn.secondary}>
            Tahrirlash
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Maksimal ball" value={hw.maxScore} icon={Target} tone="indigo" />
        <StatCard
          label="Erta bonus / kech jarima"
          value={`+${hw.earlyBonus} / -${hw.latePenalty}`}
          icon={Scale}
          tone="violet"
          hint="Har bir kun uchun"
        />
        <StatCard
          label="Topshirdi"
          value={`${submittedCount}/${hw.group.students.length}`}
          icon={Inbox}
          tone="sky"
        />
        <StatCard label="Tekshirilmagan" value={ungradedCount} icon={Hourglass} tone="amber" />
      </div>

      {(hw.description || hw.fileUrl || hw.link) && (
        <Card className="mb-6">
          {hw.description && (
            <p className="whitespace-pre-line text-sm text-slate-600">{hw.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            {hw.fileUrl && (
              <a href={hw.fileUrl} target="_blank" className="font-medium text-blue-400 hover:underline">
                📎 Vazifa fayli
              </a>
            )}
            {hw.link && (
              <a href={hw.link} target="_blank" className="font-medium text-blue-400 hover:underline">
                🔗 Vazifa havolasi
              </a>
            )}
          </div>
        </Card>
      )}

      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        O'quvchilar topshiriqlari ({hw.group.students.length})
      </h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {hw.group.students.map((m) => {
          const sub = subByStudent.get(m.student.id);
          if (!sub) {
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
            <SubmissionCard
              key={m.student.id}
              student={m.student}
              submission={sub}
              maxScore={hw.maxScore}
              dueAt={hw.dueAt}
              earlyBonus={hw.earlyBonus}
              latePenalty={hw.latePenalty}
            />
          );
        })}
      </div>
    </div>
  );
}
