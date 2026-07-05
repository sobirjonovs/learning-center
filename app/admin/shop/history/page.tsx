// Magazin — barcha buyurtmalar
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import { Receipt } from "lucide-react";
import { PageHeader, EmptyState, LinkTabs, Badge } from "@/components/ui";
import Link from "next/link";
import { PurchasesTable } from "../purchases-table";
import { fmtNumber } from "@/lib/utils";

export default async function ShopHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "shop.manage");

  const { status } = await searchParams;
  const statusFilter = status && status in PURCHASE_STATUS ? (status as PurchaseStatus) : null;

  const [purchases, newCount] = await Promise.all([
    db.purchase.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: { student: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
    db.purchase.count({ where: { status: "NEW" } }),
  ]);

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
        title="Buyurtmalar"
        subtitle="Qaysi o'quvchi qaysi mahsulotni xarid qilgani"
        backHref="/admin/shop"
      />

      <LinkTabs
        current="history"
        tabs={[
          { key: "products", href: "/admin/shop", label: "Mahsulotlar" },
          {
            key: "history",
            href: "/admin/shop/history",
            label: newCount > 0 ? `Buyurtmalar (${newCount} yangi)` : "Buyurtmalar",
          },
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.href}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
              (statusFilter ?? "") === f.key
                ? "border-blue-500/30 bg-blue-500/15 text-blue-300 classic:border-blue-200 classic:bg-blue-50 classic:text-blue-700"
                : "border-white/10 bg-white/5 text-slate-500 hover:bg-white/10 classic:border-slate-200 classic:bg-white classic:text-slate-600 classic:hover:bg-slate-50"
            )}
          >
            {f.label}
            {f.key === "NEW" && newCount > 0 && (
              <Badge tone="sky" className="ml-1.5">
                {fmtNumber(newCount)}
              </Badge>
            )}
          </Link>
        ))}
      </div>

      {purchases.length === 0 ? (
        <EmptyState icon={Receipt} title="Buyurtmalar topilmadi" hint="Tanlangan holat bo'yicha xaridlar yo'q." />
      ) : (
        <PurchasesTable purchases={purchases} />
      )}
    </div>
  );
}
