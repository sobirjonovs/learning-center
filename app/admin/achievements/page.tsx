// Yutuqlar — admin boshqaruvi
import { requireRole, requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtNumber } from "@/lib/utils";
import { Medal } from "lucide-react";
import {
  PageHeader,
  Table,
  Th,
  Td,
  ActiveBadge,
  EmptyState,
  Card,
  Alert,
  btn,
} from "@/components/ui";
import { Modal } from "@/components/modal";
import { ConfirmButton } from "@/components/confirm-button";
import { AchievementForm } from "./achievement-form";
import { toggleAchievement, deleteAchievement } from "./actions";

const ERROR_TEXT: Record<string, string> = {
  required: "Kod, nom va tavsif to'ldirilishi shart.",
  duplicate_code: "Bu kodli yutuq allaqachon mavjud.",
};

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  requirePermission(session, "achievements.manage");
  const { error } = await searchParams;

  const achievements = await db.achievement.findMany({
    orderBy: [{ active: "desc" }, { xpReward: "asc" }],
    include: { _count: { select: { students: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Yutuqlar"
        subtitle="Gamifikatsiya yutuqlari — qo'shish, tahrirlash va faollik holati"
        action={
          <Modal
            title="Yangi yutuq"
            trigger={<button className={btn.primary}>+ Yangi yutuq</button>}
          >
            <AchievementForm />
          </Modal>
        }
      />

      {error && ERROR_TEXT[error] && (
        <Alert variant="error" className="mb-4">
          {ERROR_TEXT[error]}
        </Alert>
      )}

      {achievements.length === 0 ? (
        <EmptyState
          icon={Medal}
          title="Yutuqlar yo'q"
          hint="Birinchi yutuqni qo'shish uchun yuqoridagi tugmani bosing."
          action={
            <Modal
              title="Yangi yutuq"
              trigger={<button className={btn.primary}>+ Yangi yutuq</button>}
            >
              <AchievementForm />
            </Modal>
          }
        />
      ) : (
        <Card>
          <Table
            head={
              <>
                <Th>Yutuq</Th>
                <Th>Kod</Th>
                <Th>Mukofot</Th>
                <Th>Olingan</Th>
                <Th>Holat</Th>
                <Th className="text-right">Amallar</Th>
              </>
            }
          >
            {achievements.map((a) => (
              <tr key={a.id} className="row-hover">
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-xl classic:bg-amber-50">
                      {a.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-100 classic:text-slate-800">{a.name}</div>
                      <div className="line-clamp-1 text-xs text-slate-500">{a.description}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-400 classic:bg-slate-100 classic:text-slate-600">
                    {a.code}
                  </code>
                </Td>
                <Td>
                  <div className="text-sm text-slate-300 classic:text-slate-700">
                    {a.xpReward > 0 && (
                      <span className="text-violet-400 classic:text-violet-600">
                        {fmtNumber(a.xpReward)} XP
                      </span>
                    )}
                    {a.xpReward > 0 && a.pointsReward > 0 && " · "}
                    {a.pointsReward > 0 && (
                      <span className="text-blue-400 classic:text-blue-600">
                        {fmtNumber(a.pointsReward)} ball
                      </span>
                    )}
                    {a.xpReward === 0 && a.pointsReward === 0 && "—"}
                  </div>
                </Td>
                <Td>
                  <span className="text-slate-400 classic:text-slate-600">
                    {fmtNumber(a._count.students)} ta
                  </span>
                </Td>
                <Td>
                  <ActiveBadge active={a.active} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1.5">
                    <Modal
                      title="Yutuqni tahrirlash"
                      trigger={<button className={btn.small}>Tahrirlash</button>}
                    >
                      <AchievementForm achievement={a} />
                    </Modal>
                    <form action={toggleAchievement}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className={btn.small}>
                        {a.active ? "Faolsizlantirish" : "Faollashtirish"}
                      </button>
                    </form>
                    <form action={deleteAchievement}>
                      <input type="hidden" name="id" value={a.id} />
                      <ConfirmButton
                        message={
                          a._count.students > 0
                            ? `"${a.name}" yutuqini o'chirishni tasdiqlaysizmi? ${a._count.students} ta o'quvchi yozuvi ham o'chiriladi.`
                            : `"${a.name}" yutuqini o'chirishni tasdiqlaysizmi?`
                        }
                        className={btn.dangerSmall}
                      >
                        O&apos;chirish
                      </ConfirmButton>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          <p className="mt-4 text-xs text-slate-400">
            Faol yutuqlar o&apos;quvchilarga ko&apos;rinadi va avtomatik beriladi. Faolsiz yutuqlar yangi
            o&apos;quvchilarga berilmaydi, lekin avval olinganlari saqlanadi.
          </p>
        </Card>
      )}
    </div>
  );
}
