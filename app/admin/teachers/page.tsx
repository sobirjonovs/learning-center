// O'qituvchilar ro'yxati
import Link from "next/link";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserCog } from "lucide-react";
import { ActiveBadge, Avatar, Badge, EmptyState, PageHeader, Table, Td, Th, btn, inputCls } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { deleteTeacher, toggleTeacher } from "./actions";

const dangerSmall =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20";

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "teachers.manage");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const teachers = await db.user.findMany({
    where: {
      role: "TEACHER",
      ...(query ? { OR: [{ name: { contains: query } }, { login: { contains: query } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      login: true,
      phone: true,
      image: true,
      teacherType: true,
      active: true,
      teacherSubjects: {
        include: { subject: { select: { id: true, name: true } } },
      },
      _count: { select: { teachingGroups: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="O'qituvchilar"
        subtitle={`Jami ${teachers.length} ta o'qituvchi`}
        action={
          <Link href="/admin/teachers/new" className={btn.primary}>
            + Yangi o'qituvchi
          </Link>
        }
      />

      <form action="/admin/teachers" className="mb-4 flex max-w-md gap-2">
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

      {teachers.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="O'qituvchilar topilmadi"
          hint={query ? "Qidiruv bo'yicha natija yo'q. Boshqa so'z bilan urinib ko'ring." : "Birinchi o'qituvchini qo'shing."}
          action={
            <Link href="/admin/teachers/new" className={btn.primary}>
              + Yangi o'qituvchi
            </Link>
          }
        />
      ) : (
        <Table
          head={
            <>
              <Th>O'qituvchi</Th>
              <Th>Login</Th>
              <Th>Telefon</Th>
              <Th>Turi</Th>
              <Th>Fanlar</Th>
              <Th>Guruhlar</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {teachers.map((t) => (
            <tr key={t.id} className="hover:bg-white/[0.04]">
              <Td>
                <Link href={`/admin/teachers/${t.id}`} className="flex items-center gap-3">
                  <Avatar name={t.name} image={t.image} size="sm" />
                  <span className="font-medium text-slate-100 hover:text-blue-400">{t.name}</span>
                </Link>
              </Td>
              <Td className="text-slate-500">{t.login}</Td>
              <Td className="text-slate-500">{t.phone ?? "—"}</Td>
              <Td>
                <Badge className="bg-blue-500/15 text-blue-400">{t.teacherType ?? "—"}</Badge>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {t.teacherSubjects.length === 0 ? (
                    <span className="text-slate-500">—</span>
                  ) : (
                    t.teacherSubjects.map((ts) => (
                      <Badge key={ts.subject.id} className="bg-violet-500/15 text-violet-400">
                        {ts.subject.name}
                      </Badge>
                    ))
                  )}
                </div>
              </Td>
              <Td className="text-slate-600">{t._count.teachingGroups} ta</Td>
              <Td>
                <ActiveBadge active={t.active} />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1.5">
                  <Link href={`/admin/teachers/${t.id}`} className={btn.small}>
                    Ko'rish
                  </Link>
                  <Link href={`/admin/teachers/${t.id}/edit`} className={btn.small}>
                    Tahrirlash
                  </Link>
                  <form action={toggleTeacher}>
                    <input type="hidden" name="id" value={t.id} />
                    <button type="submit" className={btn.small}>
                      {t.active ? "Faolsizlantirish" : "Faollashtirish"}
                    </button>
                  </form>
                  <form action={deleteTeacher}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton
                      message={`${t.name} o'chirilsinmi? Unga bog'liq ma'lumotlar ham o'chib ketadi.`}
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
