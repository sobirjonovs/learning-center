// O'quvchilar ro'yxati
import Link from "next/link";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { levelFromXp } from "@/lib/gamification";
import { fmtNumber, pct } from "@/lib/utils";
import { GraduationCap } from "lucide-react";
import { ActiveBadge, Avatar, Badge, EmptyState, PageHeader, Table, Td, TdActions, Th, ThActions, btn, inputCls } from "@/components/ui";
import { TableRowActions } from "@/components/table-row-actions";
import { deleteStudent, toggleStudent } from "./actions";

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
              <ThActions>Amallar</ThActions>
            </>
          }
        >
          {students.map((s) => (
            <tr key={s.id} className="group/row hover:bg-white/[0.04] classic-canvas:hover:bg-slate-50/80">
              <Td>
                <Link href={`/admin/students/${s.id}`} className="flex items-center gap-3">
                  <Avatar name={s.name} image={s.image} size="sm" />
                  <span className="font-medium text-slate-100 hover:text-blue-400">{s.name}</span>
                </Link>
              </Td>
              <Td className="whitespace-nowrap text-slate-500">{s.phone ?? "—"}</Td>
              <Td className="whitespace-nowrap text-slate-500">{s.parentPhone ?? "—"}</Td>
              <Td>
                <Badge tone="violet">{s.studentType ?? "—"}</Badge>
              </Td>
              <Td className="max-w-[9rem] text-slate-600">
                <span
                  className="line-clamp-2 text-xs leading-snug"
                  title={
                    s.groupMemberships.length > 0
                      ? s.groupMemberships.map((m) => m.group.name).join(", ")
                      : undefined
                  }
                >
                  {s.groupMemberships.length > 0
                    ? s.groupMemberships.map((m) => m.group.name).join(", ")
                    : "—"}
                </span>
              </Td>
              <Td className="whitespace-nowrap text-slate-600">{fmtNumber(s.points)}</Td>
              <Td className="whitespace-nowrap text-slate-600">{fmtNumber(s.xp)}</Td>
              <Td>
                <Badge tone="blue">{levelFromXp(s.xp).level}</Badge>
              </Td>
              <Td className="whitespace-nowrap font-semibold text-slate-200">{attendancePct(s.id)}%</Td>
              <Td>
                <ActiveBadge active={s.active} />
              </Td>
              <TdActions>
                <TableRowActions
                  links={[
                    { href: `/admin/students/${s.id}`, label: "Ko'rish" },
                    ...(canEdit ? [{ href: `/admin/students/${s.id}/edit`, label: "Tahrirlash" }] : []),
                  ]}
                  forms={[
                    ...(canEdit
                      ? [
                          {
                            action: toggleStudent,
                            id: s.id,
                            label: s.active ? "Faolsizlantirish" : "Faollashtirish",
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [
                          {
                            action: deleteStudent,
                            id: s.id,
                            label: "O'chirish",
                            confirm: `${s.name} o'chirilsinmi? Barcha natijalari ham o'chib ketadi.`,
                            danger: true,
                          },
                        ]
                      : []),
                  ]}
                />
              </TdActions>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
