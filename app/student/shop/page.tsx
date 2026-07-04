// Magazin — ballga sotib olish va xaridlar tarixi
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import { Badge, Card, CardTitle, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { buyProduct } from "./actions";

const buyBtn =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98]";
const disabledBtn =
  "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400";

export default async function StudentShopPage({
  searchParams,
}: {
  searchParams: Promise<{ xato?: string; ok?: string }>;
}) {
  const session = await requireRole("STUDENT");
  const { xato, ok } = await searchParams;

  const [user, products, purchases] = await Promise.all([
    db.user.findUnique({ where: { id: session.id }, select: { points: true } }),
    db.product.findMany({ where: { active: true }, orderBy: { price: "asc" } }),
    db.purchase.findMany({
      where: { studentId: session.id },
      include: { product: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const points = user?.points ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Magazin 🛍️" subtitle="To'plagan ballaringizni sovg'alarga almashtiring" />

      {/* Balans */}
      <div className="relative mb-6 animate-slide-up overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-violet-100">Sizning balansingiz</div>
            <div className="mt-1 text-3xl font-extrabold">⭐ {fmtNumber(points)} ball</div>
          </div>
          <div className="hidden animate-float text-6xl sm:block">🛍️</div>
        </div>
      </div>

      {xato && (
        <div className="mb-6 animate-shake rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          ❌ {xato}
        </div>
      )}
      {ok && (
        <div className="mb-6 animate-pop rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          🎉 &quot;{ok}&quot; muvaffaqiyatli sotib olindi! Buyurtmangiz administratorga yetkazildi.
        </div>
      )}

      {/* Mahsulotlar */}
      {products.length === 0 ? (
        <EmptyState icon="🛍️" title="Hozircha mahsulotlar yo'q" hint="Tez orada yangi sovg'alar qo'shiladi." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const soldOut = p.stock <= 0;
            const missing = p.price - points;
            return (
              <Card key={p.id} className="flex animate-slide-up flex-col">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-36 w-full rounded-xl bg-slate-50 object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 text-5xl">
                    🎁
                  </div>
                )}
                <div className="mt-3 font-semibold text-slate-900">{p.name}</div>
                {p.description && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.description}</div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="text-lg font-bold text-violet-600">⭐ {fmtNumber(p.price)} ball</div>
                  <Badge
                    className={soldOut ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}
                  >
                    {soldOut ? "Tugagan" : `${p.stock} ta qoldi`}
                  </Badge>
                </div>
                <div className="mt-3">
                  {soldOut ? (
                    <button type="button" disabled className={disabledBtn}>
                      😔 Tugagan
                    </button>
                  ) : missing > 0 ? (
                    <button type="button" disabled className={disabledBtn}>
                      Yana {fmtNumber(missing)} ball kerak
                    </button>
                  ) : (
                    <form action={buyProduct}>
                      <input type="hidden" name="productId" value={p.id} />
                      <ConfirmButton message="Rostdan sotib olasizmi?" className={buyBtn}>
                        🛒 Sotib olish
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Xaridlarim */}
      <div className="mt-10">
        <CardTitle>📦 Xaridlarim</CardTitle>
        {purchases.length === 0 ? (
          <EmptyState icon="📦" title="Hozircha xaridlar yo'q" hint="Ball to'plang va birinchi sovg'angizni oling!" />
        ) : (
          <Table
            head={
              <>
                <Th>Mahsulot</Th>
                <Th className="text-right">Sarflangan ball</Th>
                <Th>Sana</Th>
                <Th>Holat</Th>
              </>
            }
          >
            {purchases.map((pu) => {
              const st = PURCHASE_STATUS[pu.status as PurchaseStatus] ?? PURCHASE_STATUS.NEW;
              return (
                <tr key={pu.id}>
                  <Td className="font-medium text-slate-800">{pu.product.name}</Td>
                  <Td className="text-right font-semibold text-violet-600">
                    ⭐ {fmtNumber(pu.points)}
                  </Td>
                  <Td className="text-slate-500">{fmtDateTime(pu.createdAt)}</Td>
                  <Td>
                    <Badge className={st.badge}>{st.label}</Badge>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </div>
    </div>
  );
}
