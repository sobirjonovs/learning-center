// Magazin — ballga sotib olish va xaridlar tarixi
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import { cn, fmtDateTime, fmtNumber } from "@/lib/utils";
import { Package, PartyPopper, ShoppingBag, Star, XCircle } from "lucide-react";
import { Badge, Card, CardTitle, EmptyState, PageHeader, Table, Td, Th } from "@/components/ui";
import { CoinBalance, GameAlert, gameBtn } from "@/components/gamification";
import { ConfirmButton } from "@/components/confirm-button";
import { buyProduct } from "./actions";

const buyBtn = cn(gameBtn, "w-full");
const disabledBtn =
  "inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-500";

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
      <PageHeader
        title={
          <span className="font-display inline-flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            Magazin
          </span>
        }
        subtitle="To'plagan ballaringizni sovg'alarga almashtiring"
      />

      <CoinBalance points={fmtNumber(points)} />

      {xato && (
        <GameAlert type="error">
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {xato}
          </span>
        </GameAlert>
      )}
      {ok && (
        <GameAlert type="success">
          <span className="inline-flex items-center gap-2">
            <PartyPopper className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            &quot;{ok}&quot; muvaffaqiyatli sotib olindi! Buyurtmangiz administratorga yetkazildi.
          </span>
        </GameAlert>
      )}

      {products.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Hozircha mahsulotlar yo'q" hint="Tez orada yangi sovg'alar qo'shiladi." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const soldOut = p.stock <= 0;
            const missing = p.price - points;
            return (
              <Card key={p.id} className="game-card flex animate-slide-up flex-col">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-36 w-full rounded-xl bg-white/5 object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-5xl">
                    🎁
                  </div>
                )}
                <div className="mt-3 font-semibold text-white">{p.name}</div>
                {p.description && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-slate-500">{p.description}</div>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1 font-display text-lg font-bold text-amber-400">
                    <Star className="h-4 w-4" strokeWidth={1.75} />
                    {fmtNumber(p.price)} ball
                  </div>
                  <Badge
                    className={soldOut ? "bg-rose-500/15 text-rose-400" : "bg-emerald-500/15 text-emerald-400"}
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

      <div className="mt-10">
        <CardTitle>
          <span className="font-display inline-flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
            Xaridlarim
          </span>
        </CardTitle>
        {purchases.length === 0 ? (
          <EmptyState icon={Package} title="Hozircha xaridlar yo'q" hint="Ball to'plang va birinchi sovg'angizni oling!" />
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
                  <Td className="font-medium text-slate-100">{pu.product.name}</Td>
                  <Td className="text-right font-semibold text-amber-400">
                    <span className="inline-flex items-center justify-end gap-1">
                      <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                      {fmtNumber(pu.points)}
                    </span>
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
