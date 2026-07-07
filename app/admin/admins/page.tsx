// Administratorlar ro'yxati (faqat SUPER_ADMIN)
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import { Shield } from "lucide-react";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Avatar,
  ActiveBadge,
  EmptyState,
  btn,
} from "@/components/ui";
import { InlineActionForm } from "@/components/inline-action-form";
import { toggleAdmin, deleteAdmin } from "./actions";

export default async function AdminsPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Administratorlar"
        subtitle="Cheklangan huquqli administratorlarni boshqarish"
        action={
          <Link href="/admin/admins/new" className={btn.primary}>
            + Yangi administrator
          </Link>
        }
      />

      {admins.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Administratorlar yo'q"
          hint="Birinchi administratorni qo'shish uchun yuqoridagi tugmani bosing."
        />
      ) : (
        <Table
          head={
            <>
              <Th>F.I.Sh</Th>
              <Th>Login</Th>
              <Th>Telefon</Th>
              <Th>Huquqlar</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {admins.map((a) => {
            const permissionCount = parseJsonArray(a.permissions).length;
            return (
              <tr key={a.id} className="hover:bg-white/[0.04]">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={a.name} image={a.image} size="sm" />
                    <div className="font-medium text-slate-100">{a.name}</div>
                  </div>
                </Td>
                <Td className="text-slate-600">{a.login}</Td>
                <Td className="text-slate-600">{a.phone || "—"}</Td>
                <Td>
                  <span className="font-medium text-blue-400">{permissionCount} ta huquq</span>
                </Td>
                <Td>
                  <ActiveBadge active={a.active} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/admin/admins/${a.id}/edit`} className={btn.small}>
                      Tahrirlash
                    </Link>
                    <InlineActionForm action={toggleAdmin} hidden={{ id: a.id }}>
                      <button type="button" className={btn.small}>
                        {a.active ? "Faolsizlantirish" : "Faollashtirish"}
                      </button>
                    </InlineActionForm>
                    <InlineActionForm
                      action={deleteAdmin}
                      hidden={{ id: a.id }}
                      confirmMessage={`${a.name} administratorini o'chirishni tasdiqlaysizmi?`}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-400 transition hover:bg-rose-500/20"
                      >
                        O&apos;chirish
                      </button>
                    </InlineActionForm>
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
