// O'quvchining to'lovlar tarixi
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPriceMap } from "@/lib/payments";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { StudentPaymentHistory } from "@/components/student-payment-history";

export default async function StudentPaymentsPage() {
  const session = await requireRole("STUDENT");

  const [paymentRows, prices, studentProfile] = await Promise.all([
    db.studentPayment.findMany({
      where: { studentId: session.id },
      orderBy: [{ month: "desc" }, { recordedAt: "desc" }],
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
            subjectId: true,
            subject: { select: { name: true } },
          },
        },
      },
    }),
    db.subjectPrice.findMany({ select: { subjectId: true, groupType: true, monthlyFee: true } }),
    db.user.findUnique({ where: { id: session.id }, select: { studentType: true } }),
  ]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={
          <span className="font-display inline-flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-400" strokeWidth={1.75} />
            To&apos;lovlarim
          </span>
        }
        subtitle="Kurslar bo'yicha oylik to'lovlar tarixi"
      />

      <StudentPaymentHistory
        rows={paymentRows}
        priceMap={buildPriceMap(prices)}
        studentType={studentProfile?.studentType}
        groupLinks={false}
        title="To'lovlar tarixi"
      />
    </div>
  );
}
