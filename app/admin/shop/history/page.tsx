// Magazin — xaridlar tarixi
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime, fmtNumber, cn } from "@/lib/utils";
import { PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import {
  PageHeader,
  Table,
  Th,
  Td,
  Badge,
  Avatar,
  EmptyState,
  LinkTabs,
} from "@/components/ui";
import Link from "next/link";
import { ConfirmButton } from "@/components/confirm-button";
import { updatePurchaseStatus } from "../actions";

export default async function ShopHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");

  const { status } = await searchParams;
  const statusFilter = status && status in PURCHASE_STATUS ? (status as PurchaseStatus) : null;

  const purchases = await db.purchase.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: { student: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  const filters: Array<{ key: string; label: string; href: string }> = [
    { key: "", label: "Barchasi", href: "/admin/shop/history" },
    ...(Object.keys(PURCHASE_STATUS) as PurchaseStatus[]).map((k) => ({
      key: k,
      label: PURCHASE_STATUS[k].label,
      href: `/admin/shop/history?status=${k}`,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Xaridlar tarixi"
        subtitle="O'quvchilarning ball evaziga qilgan buyurtmalari"
        backHref="/admin/shop"
      />

      <LinkTabs
        current="history"
        tabs={[
          { key: "products", href: "/admin/shop", label: "Mahsulotlar" },
          { key: "history", href: "/admin/shop/history", label: "Xaridlar tarixi" },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
              (statusFilter ?? "") === f.key
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon="🧾" title="Xaridlar topilmadi" hint="Tanlangan holat bo'yicha buyurtmalar yo'q." />
      ) : (
        <Table
          head={
            <>
              <Th>O'quvchi</Th>
              <Th>Mahsulot</Th>
              <Th>Sarflangan ball</Th>
              <Th>Sana</Th>
              <Th>Buyurtma holati</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {purchases.map((p) => {
            const st = PURCHASE_STATUS[p.status as PurchaseStatus] ?? PURCHASE_STATUS.NEW;
            return (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.student.name} image={p.student.image} size="sm" />
                    <div className="font-medium text-slate-800">{p.student.name}</div>
                  </div>
                </Td>
                <Td className="text-slate-700">{p.product.name}</Td>
                <Td>
                  <span className="font-semibold text-indigo-600">{fmtNumber(p.points)} ball</span>
                </Td>
                <Td className="text-slate-500">{fmtDateTime(p.createdAt)}</Td>
                <Td>
                  <Badge className={st.badge}>{st.label}</Badge>
                </Td>
                <Td>
                  {p.status === "NEW" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <form action={updatePurchaseStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="DELIVERED" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                        >
                          Topshirildi
                        </button>
                      </form>
                      <form action={updatePurchaseStatus}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="status" value="CANCELLED" />
                        <ConfirmButton
                          message={`Buyurtma bekor qilinsinmi? ${fmtNumber(p.points)} ball ${p.student.name}ga qaytariladi.`}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          Bekor qilish
                        </ConfirmButton>
                      </form>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-slate-400">—</div>
                  )}
                </Td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
