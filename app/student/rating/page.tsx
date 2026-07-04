// Guruh reytingi — podium (TOP 3) va jadval
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRating } from "@/lib/gamification";
import { cn, fmtNumber, startOfMonth, startOfWeek } from "@/lib/utils";
import { Avatar, Badge, EmptyState, LinkTabs, PageHeader, Table, Td, Th } from "@/components/ui";
import { GroupSelect } from "./group-select";

const DAVR_TABS = [
  { key: "hafta", label: "Haftalik" },
  { key: "oy", label: "Oylik" },
  { key: "umumiy", label: "Umumiy" },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function StudentRatingPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; davr?: string }>;
}) {
  const session = await requireRole("STUDENT");
  const sp = await searchParams;

  const memberships = await db.groupStudent.findMany({
    where: { studentId: session.id },
    include: { group: { select: { id: true, name: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (memberships.length === 0) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Reyting 🏆" subtitle="Guruhingizdagi o'rningizni kuzating" />
        <EmptyState icon="👥" title="Siz hali birorta guruhga qo'shilmagansiz" />
      </div>
    );
  }

  const groups = memberships.map((m) => m.group);
  const groupId = groups.some((g) => g.id === sp.group) ? (sp.group as string) : groups[0].id;
  const davr = DAVR_TABS.some((t) => t.key === sp.davr) ? (sp.davr as string) : "hafta";
  const since = davr === "hafta" ? startOfWeek() : davr === "oy" ? startOfMonth() : undefined;

  const memberIds = (
    await db.groupStudent.findMany({ where: { groupId }, select: { studentId: true } })
  ).map((m) => m.studentId);
  const rating = await getRating(memberIds, since);

  const top3 = rating.slice(0, 3);
  const rest = rating.slice(3);
  // Podium tartibi: 2-o'rin, 1-o'rin (markazda), 3-o'rin
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as typeof top3;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reyting 🏆"
        subtitle="Guruhdoshlaringiz bilan bellashing!"
        action={<GroupSelect groups={groups} current={groupId} davr={davr} />}
      />

      <LinkTabs
        current={davr}
        tabs={DAVR_TABS.map((t) => ({
          key: t.key,
          label: t.label,
          href: `/student/rating?group=${groupId}&davr=${t.key}`,
        }))}
      />

      {rating.length === 0 ? (
        <EmptyState icon="🏆" title="Bu guruhda hozircha reyting yo'q" />
      ) : (
        <>
          {/* Podium */}
          <div className="mb-8 flex flex-wrap items-end justify-center gap-4">
            {podium.map((r) => {
              const first = r.place === 1;
              const me = r.studentId === session.id;
              return (
                <div
                  key={r.studentId}
                  className={cn(
                    "flex w-40 animate-bounce-in flex-col items-center rounded-2xl border p-4 text-center shadow-sm sm:w-44",
                    first
                      ? "-translate-y-3 border-amber-200 bg-gradient-to-b from-amber-50 to-white pb-7 shadow-md sm:w-52"
                      : "border-slate-200 bg-white",
                    me && "ring-2 ring-violet-400"
                  )}
                >
                  <div className={cn("animate-float", first ? "text-4xl" : "text-3xl")}>
                    {MEDALS[r.place - 1]}
                  </div>
                  <Avatar name={r.name} image={r.image} size={first ? "xl" : "lg"} className="my-2" />
                  <div className="w-full truncate text-sm font-semibold text-slate-900">
                    {r.name}
                    {me && <span className="text-violet-600"> (Siz)</span>}
                  </div>
                  <Badge className="mt-1 bg-violet-100 text-violet-700">Level {r.level}</Badge>
                  <div className={cn("mt-2 font-bold text-slate-900", first ? "text-2xl" : "text-lg")}>
                    {fmtNumber(r.xp)} XP
                  </div>
                  <div className="text-xs text-slate-400">⭐ {fmtNumber(r.points)} ball</div>
                </div>
              );
            })}
          </div>

          {/* 4-o'rindan boshlab jadval */}
          {rest.length > 0 && (
            <Table
              head={
                <>
                  <Th className="w-16">O&apos;rin</Th>
                  <Th>O&apos;quvchi</Th>
                  <Th>Level</Th>
                  <Th className="text-right">XP</Th>
                  <Th className="text-right">Ball</Th>
                </>
              }
            >
              {rest.map((r) => {
                const me = r.studentId === session.id;
                return (
                  <tr key={r.studentId} className={cn(me && "bg-violet-50")}>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                          me ? "bg-violet-200 text-violet-800" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {r.place}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} image={r.image} size="sm" />
                        <span className={cn("font-medium", me ? "text-violet-800" : "text-slate-800")}>
                          {r.name}
                          {me && <span className="font-semibold text-violet-600"> (Siz)</span>}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <Badge className="bg-violet-100 text-violet-700">Lv {r.level}</Badge>
                    </Td>
                    <Td className="text-right font-semibold text-slate-800">{fmtNumber(r.xp)}</Td>
                    <Td className="text-right text-slate-600">⭐ {fmtNumber(r.points)}</Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
