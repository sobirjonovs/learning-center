// Magazin — mahsulotlar ro'yxati
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtNumber } from "@/lib/utils";
import {
  PageHeader,
  Table,
  Th,
  Td,
  ActiveBadge,
  EmptyState,
  LinkTabs,
  btn,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { ConfirmButton } from "@/components/confirm-button";
import { ProductForm } from "./product-form";
import { toggleProduct, deleteProduct } from "./actions";

export default async function ShopPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");

  const products = await db.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { purchases: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Magazin"
        subtitle="O'quvchilar ball evaziga oladigan mahsulotlar"
        action={
          <Modal
            title="Yangi mahsulot"
            trigger={<button className={btn.primary}>+ Yangi mahsulot</button>}
          >
            <ProductForm />
          </Modal>
        }
      />

      <LinkTabs
        current="products"
        tabs={[
          { key: "products", href: "/admin/shop", label: "Mahsulotlar" },
          { key: "history", href: "/admin/shop/history", label: "Xaridlar tarixi" },
        ]}
      />

      {products.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="Mahsulotlar yo'q"
          hint="Birinchi mahsulotni qo'shish uchun yuqoridagi tugmani bosing."
        />
      ) : (
        <Table
          head={
            <>
              <Th>Mahsulot</Th>
              <Th>Tavsifi</Th>
              <Th>Ball qiymati</Th>
              <Th>Omborda</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60">
              <Td>
                <div className="flex items-center gap-3">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">
                      🎁
                    </div>
                  )}
                  <div className="font-medium text-slate-800">{p.name}</div>
                </div>
              </Td>
              <Td className="max-w-xs">
                <span className="line-clamp-2 text-slate-500">{p.description || "—"}</span>
              </Td>
              <Td>
                <span className="font-semibold text-indigo-600">{fmtNumber(p.price)} ball</span>
              </Td>
              <Td>
                <span className={p.stock === 0 ? "font-medium text-rose-600" : "text-slate-700"}>
                  {fmtNumber(p.stock)} ta
                </span>
              </Td>
              <Td>
                <ActiveBadge active={p.active} />
              </Td>
              <Td>
                <div className="flex items-center justify-end gap-1.5">
                  <Modal
                    title="Mahsulotni tahrirlash"
                    trigger={<button className={btn.small}>Tahrirlash</button>}
                  >
                    <ProductForm product={p} />
                  </Modal>
                  <form action={toggleProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className={btn.small}>
                      {p.active ? "Faolsizlantirish" : "Faollashtirish"}
                    </button>
                  </form>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton
                      message={`"${p.name}" mahsulotini o'chirishni tasdiqlaysizmi? Unga tegishli xaridlar tarixi ham o'chadi.`}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
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
