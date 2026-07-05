// Imtihonlar ro'yxati (o'qituvchi)
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, todayStr } from "@/lib/utils";
import { Modal } from "@/components/modal";
import { ConfirmButton } from "@/components/confirm-button";
import { ClipboardList } from "lucide-react";
import {
  Badge,
  EmptyState,
  Field,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
  inputCls,
} from "@/components/ui";
import { createExam, deleteExam } from "./actions";

export default async function TeacherExamsPage() {
  const session = await requireRole("TEACHER");

  const [groups, exams] = await Promise.all([
    db.group.findMany({
      where: { teacherId: session.id },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.exam.findMany({
      where: { group: { teacherId: session.id } },
      orderBy: { date: "desc" },
      include: {
        group: { select: { name: true } },
        results: { select: { score: true } },
      },
    }),
  ]);

  const newExamModal = (
    <Modal trigger={<button className={btn.primary}>+ Yangi imtihon</button>} title="Yangi imtihon">
      <form action={createExam} className="space-y-4">
        <Field label="Imtihon nomi" required>
          <input
            name="title"
            required
            placeholder="Masalan: Oraliq imtihon"
            className={inputCls}
          />
        </Field>
        <Field label="Guruh" required>
          <select name="groupId" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Guruhni tanlang
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.active ? "" : " (faol emas)"}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sana" required>
            <input type="date" name="date" required defaultValue={todayStr()} className={inputCls} />
          </Field>
          <Field label="Maksimal ball" required>
            <input
              type="number"
              name="maxScore"
              required
              min={1}
              max={1000}
              defaultValue={100}
              className={inputCls}
            />
          </Field>
        </div>
        <button type="submit" className={btn.primary}>
          Yaratish
        </button>
      </form>
    </Modal>
  );

  return (
    <div>
      <PageHeader
        title="Imtihonlar"
        subtitle="Imtihonlar o'tkazish va natijalarni kiritish"
        action={newExamModal}
      />

      {exams.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Imtihonlar hali yaratilmagan"
          hint="Yangi imtihon yaratish uchun yuqoridagi tugmani bosing."
        />
      ) : (
        <Table
          head={
            <>
              <Th>Imtihon</Th>
              <Th>Guruh</Th>
              <Th>Sana</Th>
              <Th className="text-center">Maks. ball</Th>
              <Th className="text-center">Natijalar</Th>
              <Th className="text-center">O'rtacha ball</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {exams.map((exam) => {
            const avg =
              exam.results.length > 0
                ? Math.round(exam.results.reduce((s, r) => s + r.score, 0) / exam.results.length)
                : null;
            return (
              <tr key={exam.id} className="hover:bg-white/[0.04]">
                <Td>
                  <Link
                    href={`/teacher/exams/${exam.id}`}
                    className="font-medium text-slate-200 hover:text-blue-400"
                  >
                    {exam.title}
                  </Link>
                </Td>
                <Td className="text-slate-500">{exam.group.name}</Td>
                <Td className="text-slate-500">{fmtDate(exam.date)}</Td>
                <Td className="text-center font-semibold text-slate-200">{exam.maxScore}</Td>
                <Td className="text-center text-slate-600">{exam.results.length} ta</Td>
                <Td className="text-center">
                  {avg !== null ? (
                    <Badge className="bg-emerald-500/15 text-emerald-400">{avg}</Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/teacher/exams/${exam.id}`} className={btn.small}>
                      Natijalar
                    </Link>
                    <form action={deleteExam}>
                      <input type="hidden" name="id" value={exam.id} />
                      <ConfirmButton
                        message={`"${exam.title}" imtihonini o'chirmoqchimisiz? Natijalar ham o'chadi.`}
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                      >
                        O'chirish
                      </ConfirmButton>
                    </form>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
