// To'lovlar: fan narxlari (Umumiy/Individual) va oylik to'lov nazorati (guruh kesimida)
import Link from "next/link";
import { requirePermission, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtNumber } from "@/lib/utils";
import {
  buildPriceMap,
  currentMonth,
  expectedMonthlyFee,
  PAYMENT_STATUS,
  paymentStatus,
} from "@/lib/payments";
import { Badge, Card, CardTitle, PageHeader, Table, Td, Th, btn, inputCls, selectCls } from "@/components/ui";
import { ActionForm } from "@/components/action-form";
import { upsertStudentPayment, upsertSubjectPrices } from "./actions";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string; month?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "payments.manage");

  const canEditPrices = session.role === "SUPER_ADMIN";

  const { groupId, month } = await searchParams;
  const activeMonth = month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonth();

  const groups = await db.group.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, type: true, subjectId: true, subject: { select: { name: true } } },
  });

  const currentGroupId = groupId && groups.some((g) => g.id === groupId) ? groupId : groups[0]?.id ?? null;

  const [subjects, prices, group] = await Promise.all([
    db.subject.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.subjectPrice.findMany({ select: { subjectId: true, groupType: true, monthlyFee: true } }),
    currentGroupId
      ? db.group.findUnique({
          where: { id: currentGroupId },
          include: {
            subject: { select: { id: true, name: true } },
            students: {
              orderBy: { joinedAt: "asc" },
              include: { student: { select: { id: true, name: true, studentType: true } } },
            },
          },
        })
      : null,
  ]);

  const priceMap = buildPriceMap(prices);
  const baseFee = expectedMonthlyFee(priceMap, group?.subject?.id, group?.type);

  const payments = group
    ? await db.studentPayment.findMany({
        where: { groupId: group.id, month: activeMonth },
        select: { studentId: true, amount: true, note: true },
      })
    : [];
  const payMap = new Map<string, { amount: number; note: string | null }>();
  for (const p of payments) payMap.set(p.studentId, { amount: p.amount, note: p.note ?? null });

  const paidCount = group
    ? group.students.filter((m) => {
        const fee = expectedMonthlyFee(priceMap, group.subject?.id, group.type, m.student.studentType);
        return paymentStatus(payMap.get(m.student.id)?.amount ?? 0, fee, m.student.studentType) === "PAID";
      }).length
    : 0;
  const partialCount = group
    ? group.students.filter((m) => {
        const fee = expectedMonthlyFee(priceMap, group.subject?.id, group.type, m.student.studentType);
        return paymentStatus(payMap.get(m.student.id)?.amount ?? 0, fee, m.student.studentType) === "PARTIAL";
      }).length
    : 0;
  const exemptCount = group
    ? group.students.filter((m) =>
        paymentStatus(0, baseFee, m.student.studentType) === "EXEMPT"
      ).length
    : 0;
  const unpaidCount = group ? group.students.length - paidCount - partialCount - exemptCount : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="To'lovlar"
        subtitle="Fan narxlari va oylik to'lov nazorati"
        action={
          <Link href="/admin/groups" className={btn.secondary}>
            Guruhlar
          </Link>
        }
      />

      <Card>
        <CardTitle>Fan narxlari (oylik, so&apos;m)</CardTitle>
        <p className="mb-5 text-sm text-slate-400">
          {canEditPrices
            ? "Har bir fan uchun Umumiy va Individual narxni belgilang."
            : "Narxlar faqat Super Admin tomonidan o'zgartiriladi. Siz faqat ko'rishingiz mumkin."}
        </p>

        {subjects.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Faol fan kategoriyalari yo&apos;q</p>
        ) : (
          <Table
            head={
              <>
                <Th className="w-[12rem]">Fan</Th>
                <Th>Umumiy guruh (so&apos;m)</Th>
                <Th>Individual guruh (so&apos;m)</Th>
                {canEditPrices && <Th className="w-[6.5rem]" />}
              </>
            }
          >
            {subjects.map((s) => {
              const umumiy = priceMap.get(`${s.id}:Umumiy`);
              const individual = priceMap.get(`${s.id}:Individual`);
              return (
                <tr key={s.id} className="hover:bg-white/[0.03]">
                  <Td className="font-semibold text-slate-100">{s.name}</Td>
                  {canEditPrices ? (
                    <Td colSpan={3} className="!py-3">
                      <ActionForm
                        action={upsertSubjectPrices}
                        className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_auto]"
                      >
                        <input type="hidden" name="subjectId" value={s.id} />
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 sm:sr-only">Umumiy</label>
                          <input
                            name="fee_umumiy"
                            type="number"
                            min={1}
                            step={1000}
                            required
                            defaultValue={umumiy ?? ""}
                            placeholder="400 000"
                            className={inputCls + " w-full tabular-nums"}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-slate-500 sm:sr-only">Individual</label>
                          <input
                            name="fee_individual"
                            type="number"
                            min={1}
                            step={1000}
                            required
                            defaultValue={individual ?? ""}
                            placeholder="800 000"
                            className={inputCls + " w-full tabular-nums"}
                          />
                        </div>
                        <button type="submit" className={btn.primary + " h-[42px] px-5 text-sm"}>
                          Saqlash
                        </button>
                      </ActionForm>
                    </Td>
                  ) : (
                    <>
                      <Td className="tabular-nums text-slate-200">
                        {umumiy ? `${fmtNumber(umumiy)} so'm` : "—"}
                      </Td>
                      <Td className="tabular-nums text-slate-200">
                        {individual ? `${fmtNumber(individual)} so'm` : "—"}
                      </Td>
                    </>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card className="w-full">
        <CardTitle>Oylik to&apos;lov nazorati</CardTitle>

        <form
          action="/admin/payments"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Guruh</label>
            <select name="groupId" defaultValue={currentGroupId ?? ""} className={selectCls + " w-full"} required>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-44">
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Oy</label>
            <input name="month" type="month" defaultValue={activeMonth} className={inputCls + " w-full"} required />
          </div>
          <button type="submit" className={btn.secondary + " w-full sm:w-auto"}>
            Ko&apos;rsatish
          </button>
        </form>

        {!group ? (
          <p className="py-10 text-center text-sm text-slate-400">Guruh tanlanmagan</p>
        ) : (
          <>
            <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-xs text-slate-500">Fan / turi</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge tone="violet">{group.subject?.name ?? "Fan yo'q"}</Badge>
                  <Badge tone="sky">{group.type ?? "—"}</Badge>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="text-xs text-slate-500">Oylik narx (oddiy)</div>
                <div className="mt-1 text-lg font-bold tabular-nums text-slate-100">
                  {baseFee ? `${fmtNumber(baseFee)} so'm` : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="text-xs text-emerald-400/80">To&apos;landi</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-emerald-300">{paidCount}</div>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <div className="text-xs text-amber-400/80">Qisman</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-amber-300">{partialCount}</div>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
                <div className="text-xs text-rose-400/80">To&apos;lanmadi</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-rose-300">{unpaidCount}</div>
              </div>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
                <div className="text-xs text-sky-400/80">Ijtimoiy</div>
                <div className="mt-1 text-2xl font-bold tabular-nums text-sky-300">{exemptCount}</div>
              </div>
            </div>

            {group.students.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">Bu guruhda o&apos;quvchi yo&apos;q</p>
            ) : (
              <Table
                head={
                  <>
                    <Th>O&apos;quvchi</Th>
                    <Th>Turi</Th>
                    <Th>Holat</Th>
                    <Th className="text-right">To&apos;langan</Th>
                    <Th className="min-w-[20rem] text-right">To&apos;lov kiritish</Th>
                  </>
                }
              >
                {group.students.map((m) => {
                  const paid = payMap.get(m.student.id)?.amount ?? 0;
                  const note = payMap.get(m.student.id)?.note ?? "";
                  const fee = expectedMonthlyFee(priceMap, group.subject?.id, group.type, m.student.studentType);
                  const status = paymentStatus(paid, fee, m.student.studentType);
                  const st = PAYMENT_STATUS[status];
                  const isExempt = status === "EXEMPT";
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.03]">
                      <Td>
                        <Link
                          href={`/admin/students/${m.student.id}`}
                          className="font-medium text-slate-100 hover:text-blue-400"
                        >
                          {m.student.name}
                        </Link>
                      </Td>
                      <Td>
                        <Badge tone={isExempt ? "sky" : "violet"}>{m.student.studentType ?? "Oddiy"}</Badge>
                      </Td>
                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </Td>
                      <Td className="text-right font-semibold tabular-nums text-slate-200">
                        {isExempt ? "—" : `${fmtNumber(paid)} so&apos;m`}
                      </Td>
                      <Td>
                        {isExempt ? (
                          <span className="block text-right text-sm text-slate-500">To&apos;lov talab qilinmaydi</span>
                        ) : (
                          <ActionForm
                            action={upsertStudentPayment}
                            className="flex flex-wrap items-center justify-end gap-2"
                          >
                            <input type="hidden" name="studentId" value={m.student.id} />
                            <input type="hidden" name="groupId" value={group.id} />
                            <input type="hidden" name="month" value={activeMonth} />
                            <input
                              name="amount"
                              type="number"
                              min={0}
                              step={1000}
                              defaultValue={paid || fee || 0}
                              className={inputCls + " w-32 tabular-nums"}
                              aria-label="To'lov summasi"
                            />
                            <input
                              name="note"
                              defaultValue={note}
                              placeholder="Izoh"
                              className={inputCls + " min-w-[8rem] flex-1 max-w-[14rem]"}
                            />
                            <button type="submit" className={btn.primarySmall + " shrink-0"}>
                              Saqlash
                            </button>
                          </ActionForm>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
