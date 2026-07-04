// Guruhlar ro'yxati
import Link from "next/link";
import { can, requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import { ActiveBadge, Badge, EmptyState, PageHeader, Table, Td, Th, btn, inputCls } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteGroup, toggleGroup } from "./actions";

const dangerSmall =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50";

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
          icon="👥"
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
              <Th>Turi</Th>
              <Th>O'qituvchi</Th>
              <Th>O'quvchilar</Th>
              <Th>Kunlar</Th>
              <Th>Vaqti</Th>
              <Th>Xona</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {groups.map((g) => (
            <tr key={g.id} className="hover:bg-slate-50/60">
              <Td>
                <Link href={`/admin/groups/${g.id}`} className="font-medium text-slate-800 hover:text-indigo-600">
                  {g.name}
                </Link>
              </Td>
              <Td>
                <Badge className="bg-sky-100 text-sky-700">{g.type ?? "—"}</Badge>
              </Td>
              <Td className="text-slate-600">
                {g.teacher ? (
                  <Link href={`/admin/teachers/${g.teacher.id}`} className="hover:text-indigo-600">
                    {g.teacher.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="text-slate-600">{g._count.students} ta</Td>
              <Td className="max-w-48 text-slate-600">{parseJsonArray(g.days).join(", ")}</Td>
              <Td className="whitespace-nowrap text-slate-600">{g.time}</Td>
              <Td className="text-slate-600">{g.room ?? "—"}</Td>
              <Td>
                <ActiveBadge active={g.active} />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/groups/${g.id}`} className={btn.small}>
                    Ko'rish
                  </Link>
                  <Link href={`/admin/groups/${g.id}/edit`} className={btn.small}>
                    Tahrirlash
                  </Link>
                  <form action={toggleGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <button type="submit" className={btn.small}>
                      {g.active ? "Faolsizlantirish" : "Faollashtirish"}
                    </button>
                  </form>
                  <form action={deleteGroup}>
                    <input type="hidden" name="id" value={g.id} />
                    <ConfirmButton
                      message={`"${g.name}" guruhi o'chirilsinmi? Davomat, vazifa va imtihon yozuvlari ham o'chadi.`}
                      className={dangerSmall}
                    >
                      O'chirish
                    </ConfirmButton>
                  </form>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
