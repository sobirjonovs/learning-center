// Magazin — mahsulotlar va yangi buyurtmalar
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtNumber } from "@/lib/utils";
import { ShoppingBag, Receipt } from "lucide-react";
import Link from "next/link";
import {
  PageHeader,
  Table,
  Th,
  Td,
  ActiveBadge,
  EmptyState,
  LinkTabs,
  Card,
  CardTitle,
  btn,
  Alert,
  Badge,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { ConfirmButton } from "@/components/confirm-button";
import { ProductForm } from "./product-form";
import { PurchasesTable } from "./purchases-table";
import { toggleProduct, deleteProduct } from "./actions";

export default async function ShopPage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");

  const [products, recentPurchases, newCount] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { purchases: true } } },
    }),
    db.purchase.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: { student: true, product: true },
    }),
    db.purchase.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Magazin"
        subtitle="O'quvchilar ball evaziga oladigan mahsulotlar va buyurtmalar"
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
          {
            key: "history",
            href: "/admin/shop/history",
            label: newCount > 0 ? `Buyurtmalar (${newCount} yangi)` : "Buyurtmalar",
          },
        ]}
      />

      {newCount > 0 && (
        <Alert variant="info" className="mb-6">
          <span className="font-semibold">{fmtNumber(newCount)} ta yangi buyurtma</span> kutilmoqda — o&apos;quvchi
          mahsulot sotib oldi. Quyidagi jadvaldan ko&apos;ring va &quot;Topshirildi&quot; deb belgilang.
        </Alert>
      )}

      <Card className="mb-8">
        <CardTitle
          action={
            recentPurchases.length > 0 ? (
              <Link href="/admin/shop/history" className={btn.ghost + " !px-2 !py-1 text-xs"}>
                Barcha buyurtmalar →
              </Link>
            ) : undefined
          }
        >
          <span className="inline-flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-400 classic:text-blue-600" strokeWidth={1.75} />
            So&apos;nggi xaridlar
            {newCount > 0 && <Badge tone="sky">{fmtNumber(newCount)} yangi</Badge>}
          </span>
        </CardTitle>
        {recentPurchases.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Hozircha xaridlar yo'q"
            hint="O'quvchi magazindan mahsulot sotib olganda bu yerda ko'rinadi."
          />
        ) : (
          <PurchasesTable purchases={recentPurchases} />
        )}
      </Card>

      <CardTitle className="mb-4">
        <span className="inline-flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-blue-400 classic:text-blue-600" strokeWidth={1.75} />
          Mahsulotlar
        </span>
      </CardTitle>

      {products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
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
              <Th>Xaridlar</Th>
              <Th>Holat</Th>
              <Th className="text-right">Amallar</Th>
            </>
          }
        >
          {products.map((p) => (
            <tr key={p.id} className="row-hover">
              <Td>
                <div className="flex items-center gap-3">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-xl border border-white/10 object-cover classic:border-slate-200"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl classic:bg-blue-50">
                      🎁
                    </div>
                  )}
                  <div className="font-medium text-slate-100 classic:text-slate-800">{p.name}</div>
                </div>
              </Td>
              <Td className="max-w-xs">
                <span className="line-clamp-2 text-slate-500">{p.description || "—"}</span>
              </Td>
              <Td>
                <span className="font-semibold text-blue-400 classic:text-blue-600">
                  {fmtNumber(p.price)} ball
                </span>
              </Td>
              <Td>
                <span
                  className={
                    p.stock === 0
                      ? "font-medium text-rose-400 classic:text-rose-600"
                      : "text-slate-300 classic:text-slate-700"
                  }
                >
                  {fmtNumber(p.stock)} ta
                </span>
              </Td>
              <Td>
                <span className="text-slate-400 classic:text-slate-600">
                  {fmtNumber(p._count.purchases)} marta
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
                    <ConfirmButton message={`"${p.name}" mahsulotini o'chirishni tasdiqlaysizmi?`} className={btn.dangerSmall}>
                      O&apos;chirish
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
