import Link from "next/link";
import { expectedMonthlyFee, PAYMENT_STATUS, paymentStatus } from "@/lib/payments";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import { Badge, Card, CardTitle, Td, Th } from "@/components/ui";

export type PaymentHistoryRow = {
  id: string;
  month: string;
  amount: number;
  note: string | null;
  recordedAt: Date;
  group: {
    id: string;
    name: string;
    type: string | null;
    subjectId: string | null;
    subject: { name: string } | null;
  };
};

export function StudentPaymentHistory({
  rows,
  priceMap,
  groupLinks = true,
  title = "To'lovlar tarixi",
  id,
}: {
  rows: PaymentHistoryRow[];
  priceMap: Map<string, number>;
  groupLinks?: boolean;
  title?: string;
  id?: string;
}) {
  const totalPaid = rows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div id={id}>
      <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-slate-400">
            Jami {rows.length} ta yozuv · {fmtNumber(totalPaid)} so&apos;m to&apos;langan
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">To&apos;lov yozuvlari yo&apos;q</p>
      ) : (
        <div className="-m-5 mt-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wide text-slate-500">
                <Th>Oy</Th>
                <Th>Guruh</Th>
                <Th>Fan</Th>
                <Th>Holat</Th>
                <Th className="text-right">Kutilgan</Th>
                <Th className="text-right">To&apos;langan</Th>
                <Th>Izoh</Th>
                <Th>Sana</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((p) => {
                const fee = expectedMonthlyFee(priceMap, p.group.subjectId, p.group.type);
                const st = PAYMENT_STATUS[paymentStatus(p.amount, fee)];
                return (
                  <tr key={p.id}>
                    <Td className="whitespace-nowrap font-medium text-slate-100">{p.month}</Td>
                    <Td>
                      {groupLinks ? (
                        <Link href={`/admin/groups/${p.group.id}`} className="hover:text-blue-400">
                          {p.group.name}
                        </Link>
                      ) : (
                        <span className="text-slate-200">{p.group.name}</span>
                      )}
                    </Td>
                    <Td className="text-slate-500">{p.group.subject?.name ?? "—"}</Td>
                    <Td>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </Td>
                    <Td className="text-right text-slate-500">{fee ? fmtNumber(fee) : "—"}</Td>
                    <Td className="text-right font-semibold text-slate-200">{fmtNumber(p.amount)}</Td>
                    <Td className="max-w-[10rem] truncate text-slate-500">
                      <span title={p.note ?? undefined}>{p.note ?? "—"}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(p.recordedAt)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </Card>
    </div>
  );
}
