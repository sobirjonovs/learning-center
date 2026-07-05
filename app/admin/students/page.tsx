// O'quvchilar ro'yxati
import Link from "next/link";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";
import { fmtNumber, pct } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import { ActiveBadge, Avatar, Badge, EmptyState, PageHeader, Table, Td, Th, btn, inputCls } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteStudent, toggleStudent } from "./actions";

const dangerSmall =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "students.view");
  const canCreate = can(session, "students.create");
  const canEdit = can(session, "students.edit");
  const canDelete = can(session, "students.delete");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [students, attendanceStats] = await Promise.all([
    db.user.findMany({
      where: {
        role: "STUDENT",
        ...(query ? { OR: [{ name: { contains: query } }, { login: { contains: query } }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        parentPhone: true,
        image: true,
        studentType: true,
        points: true,
        xp: true,
        active: true,
        groupMemberships: { select: { group: { select: { name: true } } } },
      },
    }),
    db.attendance.groupBy({ by: ["studentId", "status"], _count: { _all: true } }),
  ]);

  // O'quvchi kesimidagi davomat foizi (bitta so'rov bilan)
  const attMap = new Map<string, { present: number; total: number }>();
  for (const row of attendanceStats) {
    const cur = attMap.get(row.studentId) ?? { present: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === "PRESENT" || row.status === "LATE") cur.present += row._count._all;
    attMap.set(row.studentId, cur);
  }
  const attendancePct = (id: string) => {
    const s = attMap.get(id);
    return s ? pct(s.present, s.total) : 0;
  };

  return (
    <div>
      <PageHeader
        title="O'quvchilar"
        subtitle={`Jami ${students.length} ta o'quvchi`}
        action={
          canCreate ? (
            <Link href="/admin/students/new" className={btn.primary}>
              + Yangi o'quvchi
            </Link>
          ) : undefined
        }
      />

      <form action="/admin/students" className="mb-4 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="Ism yoki login bo'yicha qidirish..."
          className={inputCls}
        />
        <button type="submit" className={btn.secondary}>
          Qidirish
        </button>
      </form>

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="O'quvchilar topilmadi"
          hint={query ? "Qidiruv bo'yicha natija yo'q." : "Birinchi o'quvchini qo'shing."}
          action={
            canCreate ? (
              <Link href="/admin/students/new" className={btn.primary}>
                + Yangi o'quvchi
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>O'quvchi</Th>
              <Th>Telefon</Th>
              <Th>Ota-ona tel.</Th>
              <Th>Turi</Th>
              <Th>Guruhlari</Th>
              <Th>Ball</Th>
              <Th>XP</Th>
              <Th>Daraja</Th>
              <Th>Davomat</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.04]">
              <Td>
                <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3">
                  <Avatar name={s.name} image={s.image} size="sm" />
                  <span className="font-medium text-slate-100 hover:text-blue-400">{s.name}</span>
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-slate-500">{s.phone ?? "—"}</Td>
              <Td className="whitespace-nowrap text-slate-500">{s.parentPhone ?? "—"}</Td>
              <Td>
                <Badge className="bg-violet-500/15 text-violet-400">{s.studentType ?? "—"}</Badge>
              </Td>
              <Td className="max-w-48 text-slate-600">
                {s.groupMemberships.length > 0
                  ? s.groupMemberships.map((m) => m.group.name).join(", ")
                  : "—"}
              </Td>
              <Td className="text-slate-600">{fmtNumber(s.points)}</Td>
              <Td className="text-slate-600">{fmtNumber(s.xp)}</Td>
              <Td>
                <Badge className="bg-blue-500/15 text-blue-400">{levelFromXp(s.xp).level}</Badge>
              </Td>
              <Td className="font-semibold text-slate-200">{attendancePct(s.id)}%</Td>
              <Td>
                <ActiveBadge active={s.active} />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/students/${s.id}`} className={btn.small}>
                    Ko'rish
                  </Link>
                  {canEdit && (
                    <Link href={`/admin/students/${s.id}/edit`} className={btn.small}>
                      Tahrirlash
                    </Link>
                  )}
                  {canEdit && (
                    <form action={toggleStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className={btn.small}>
                        {s.active ? "Faolsizlantirish" : "Faollashtirish"}
                      </button>
                    </form>
                  )}
                  {canDelete && (
                    <form action={deleteStudent}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton
                        message={`${s.name} o'chirilsinmi? Barcha natijalari ham o'chib ketadi.`}
                        className={dangerSmall}
                      >
                        O'chirish
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
