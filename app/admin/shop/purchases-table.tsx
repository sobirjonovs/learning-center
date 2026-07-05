// Magazin buyurtmalari jadvali — admin sahifalarida qayta ishlatiladi
import Link from "next/link";
import { fmtDateTime, fmtNumber } from "@/lib/utils";
import { PURCHASE_STATUS, type PurchaseStatus } from "@/lib/constants";
import {
  Table,
  Th,
  Td,
  Badge,
  Avatar,
  btn,
} from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";
import { updatePurchaseStatus } from "./actions";

type PurchaseRow = {
  id: string;
  points: number;
  status: string;
  createdAt: Date;
  student: { id: string; name: string; image: string | null };
  product: { name: string };
};

export function PurchasesTable({
  purchases,
  showActions = true,
}: {
  purchases: PurchaseRow[];
  showActions?: boolean;
}) {
  return (
    <Table
      head={
        <>
          <Th>O&apos;quvchi</Th>
          <Th>Mahsulot</Th>
          <Th>Sarflangan ball</Th>
          <Th>Sana</Th>
          <Th>Holat</Th>
          {showActions && <Th className="text-right">Amallar</Th>}
        </>
      }
    >
      {purchases.map((p) => {
        const st = PURCHASE_STATUS[p.status as PurchaseStatus] ?? PURCHASE_STATUS.NEW;
        return (
          <tr key={p.id} className="row-hover">
            <Td>
              <div className="flex items-center gap-3">
                <Avatar name={p.student.name} image={p.student.image} size="sm" />
                <Link
                  href={`/admin/students/${p.student.id}`}
                  className="font-medium text-slate-100 transition hover:text-blue-400 classic:text-slate-800 classic:hover:text-blue-600"
                >
                  {p.student.name}
                </Link>
              </div>
            </Td>
            <Td className="text-slate-300 classic:text-slate-700">{p.product.name}</Td>
            <Td>
              <span className="font-semibold text-blue-400 classic:text-blue-600">
                {fmtNumber(p.points)} ball
              </span>
            </Td>
            <Td className="text-slate-500">{fmtDateTime(p.createdAt)}</Td>
            <Td>
              <Badge className={st.badge}>{st.label}</Badge>
            </Td>
            {showActions && (
              <Td>
                {p.status === "NEW" ? (
                  <div className="flex items-center justify-end gap-1.5">
                    <form action={updatePurchaseStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="DELIVERED" />
                      <button type="submit" className={btn.primarySmall}>
                        Topshirildi
                      </button>
                    </form>
                    <form action={updatePurchaseStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="status" value="CANCELLED" />
                      <ConfirmButton
                        message={`Buyurtma bekor qilinsinmi? ${fmtNumber(p.points)} ball ${p.student.name}ga qaytariladi.`}
                        className={btn.dangerSmall}
                      >
                        Bekor qilish
                      </ConfirmButton>
                    </form>
                  </div>
                ) : (
                  <div className="text-right text-xs text-slate-400">—</div>
                )}
              </Td>
            )}
          </tr>
        );
      })}
    </Table>
  );
}
