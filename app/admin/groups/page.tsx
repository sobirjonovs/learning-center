// Guruhlar ro'yxati
import Link from "next/link";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import { Users } from "lucide-react";
import { ActiveBadge, Badge, EmptyState, PageHeader, Table, Td, TdActions, Th, ThActions, btn, inputCls } from "@/components/ui";
import { TableRowActions } from "@/components/table-row-actions";
import { deleteGroup, toggleGroup } from "./actions";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "groups.manage");
  const canCreate = can(session, "groups.create");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const groups = await db.group.findMany({
    where: query ? { name: { contains: query } } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Guruhlar"
        subtitle={`Jami ${groups.length} ta guruh`}
        action={
          canCreate ? (
            <Link href="/admin/groups/new" className={btn.primary}>
              + Yangi guruh
            </Link>
          ) : undefined
        }
      />

      <form action="/admin/groups" className="mb-4 flex max-w-md gap-2">
        <input name="q" defaultValue={query} placeholder="Guruh nomi bo'yicha qidirish..." className={inputCls} />
        <button type="submit" className={btn.secondary}>
          Qidirish
        </button>
      </form>

      {groups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Guruhlar topilmadi"
          hint={query ? "Qidiruv bo'yicha natija yo'q." : "Birinchi guruhni yarating."}
          action={
            canCreate ? (
              <Link href="/admin/groups/new" className={btn.primary}>
                + Yangi guruh
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>Nomi</Th>
              <Th>Kategoriya</Th>
              <Th>Turi</Th>
              <Th>O'qituvchi</Th>
              <Th>O'quvchilar</Th>
              <Th>Kunlar</Th>
              <Th>Vaqti</Th>
              <Th>Xona</Th>
              <Th>Holat</Th>
              <ThActions>Amallar</ThActions>
            </>
          }
        >
          {groups.map((g) => (
            <tr key={g.id} className="group/row hover:bg-white/[0.04] classic-canvas:hover:bg-slate-50/80">
              <Td>
                <Link href={`/admin/groups/${g.id}`} className="font-medium text-slate-100 hover:text-blue-400">
                  {g.name}
                </Link>
              </Td>
              <Td>
                {g.subject ? (
                  <Badge tone="violet">{g.subject.name}</Badge>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </Td>
              <Td>
                <Badge tone="sky">{g.type ?? "—"}</Badge>
              </Td>
              <Td className="max-w-[9rem] text-slate-600">
                {g.teacher ? (
                  <Link href={`/admin/teachers/${g.teacher.id}`} className="hover:text-blue-400">
                    {g.teacher.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="whitespace-nowrap text-slate-600">{g._count.students} ta</Td>
              <Td className="max-w-[8rem] text-slate-600">
                <span className="line-clamp-2 text-xs leading-snug" title={parseJsonArray(g.days).join(", ")}>
                  {parseJsonArray(g.days).join(", ") || "—"}
                </span>
              </Td>
              <Td className="whitespace-nowrap text-slate-600">{g.time}</Td>
              <Td className="whitespace-nowrap text-slate-600">{g.room ?? "—"}</Td>
              <Td>
                <ActiveBadge active={g.active} />
              </Td>
              <TdActions>
                <TableRowActions
                  links={[
                    { href: `/admin/groups/${g.id}`, label: "Ko'rish" },
                    { href: `/admin/groups/${g.id}/edit`, label: "Tahrirlash" },
                  ]}
                  forms={[
                    {
                      action: toggleGroup,
                      id: g.id,
                      label: g.active ? "Faolsizlantirish" : "Faollashtirish",
                    },
                    {
                      action: deleteGroup,
                      id: g.id,
                      label: "O'chirish",
                      confirm: `"${g.name}" guruhi o'chirilsinmi? Davomat, vazifa va imtihon yozuvlari ham o'chadi.`,
                      danger: true,
                    },
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
