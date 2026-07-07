// Fan kategoriyalari — admin boshqaruvi
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookOpen } from "lucide-react";
import {
  ActiveBadge,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
  btn,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { InlineActionForm } from "@/components/inline-action-form";
import { CategoryForm } from "./category-form";
import { deleteCategory, toggleCategory } from "./actions";

export default async function CategoriesPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "categories.manage");

  const categories = await db.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { teachers: true, groups: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Fan kategoriyalari"
        subtitle="O'qituvchi va guruhlarga biriktiriladigan fanlar (Matematika, Ingliz tili, Frontend...)"
        action={
          <Modal
            title="Yangi kategoriya"
            trigger={<button className={btn.primary}>+ Yangi kategoriya</button>}
          >
            <CategoryForm />
          </Modal>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Kategoriyalar yo'q"
          hint="Birinchi fan kategoriyasini qo'shing — masalan Matematika yoki Ingliz tili."
          action={
            <Modal
              title="Yangi kategoriya"
              trigger={<button className={btn.primary}>+ Yangi kategoriya</button>}
            >
              <CategoryForm />
            </Modal>
          }
        />
      ) : (
        <Card>
          <Table
            head={
              <>
                <Th>Nomi</Th>
                <Th>O'qituvchilar</Th>
                <Th>Guruhlar</Th>
                <Th>Holat</Th>
                <Th className="text-right">Amallar</Th>
              </>
            }
          >
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-white/[0.04]">
                <Td>
                  <span className="font-medium text-slate-100">{c.name}</span>
                </Td>
                <Td className="text-slate-600">{c._count.teachers} ta</Td>
                <Td className="text-slate-600">{c._count.groups} ta</Td>
                <Td>
                  <ActiveBadge active={c.active} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Modal
                      title="Kategoriyani tahrirlash"
                      trigger={<button className={btn.small}>Tahrirlash</button>}
                    >
                      <CategoryForm category={c} />
                    </Modal>
                    <InlineActionForm action={toggleCategory} hidden={{ id: c.id }}>
                      <button type="button" className={btn.small}>
                        {c.active ? "Faolsizlantirish" : "Faollashtirish"}
                      </button>
                    </InlineActionForm>
                    <InlineActionForm
                      action={deleteCategory}
                      hidden={{ id: c.id }}
                      confirmMessage={`"${c.name}" kategoriyasi o'chirilsinmi?`}
                    >
                      <button type="button" className={btn.dangerSmall}>
                        O&apos;chirish
                      </button>
                    </InlineActionForm>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-4 text-xs text-slate-400">
            Faol kategoriyalar o&apos;qituvchi va guruh formalarida tanlash uchun ko&apos;rinadi.
            Biriktirilgan kategoriyani o&apos;chirishdan oldin o&apos;qituvchi yoki guruhdan ajrating.
          </p>
        </Card>
      )}
    </div>
  );
}
