// Guruh reytingi — podium (TOP 3) va jadval

import { requireRole } from "@/lib/auth";

import { db } from "@/lib/db";

import { getRating } from "@/lib/gamification";

import { cn, fmtNumber, startOfMonth, startOfWeek } from "@/lib/utils";

import { Star, Trophy, Users } from "lucide-react";
import { Avatar, Badge, EmptyState, LinkTabs, PageHeader, Table, Td, Th } from "@/components/ui";
import { PodiumSlot } from "@/components/gamification";
import { RankMedal } from "@/components/rank-medal";

import { GroupSelect } from "./group-select";



const DAVR_TABS = [

  { key: "hafta", label: "Haftalik" },

  { key: "oy", label: "Oylik" },

  { key: "umumiy", label: "Umumiy" },

] as const;



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

        <PageHeader

          title={
            <span className="font-display inline-flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
              Reyting
            </span>
          }

          subtitle="Guruhingizdagi o'rningizni kuzating"

        />

        <EmptyState icon={Users} title="Siz hali birorta guruhga qo'shilmagansiz" />

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

  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as typeof top3;



  return (

    <div className="animate-fade-in">

      <PageHeader

        title={
          <span className="font-display inline-flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
            Reyting
          </span>
        }

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

        <EmptyState icon={Trophy} title="Bu guruhda hozircha reyting yo'q" />

      ) : (

        <>

          <div className="mb-8 flex flex-wrap items-end justify-center gap-4">

            {podium.map((r) => (

              <PodiumSlot

                key={r.studentId}

                place={r.place}

                name={r.name}

                image={r.image}

                level={r.level}

                xp={fmtNumber(r.xp)}

                points={fmtNumber(r.points)}

                isMe={r.studentId === session.id}

                first={r.place === 1}

              />

            ))}

          </div>



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

                  <tr key={r.studentId} className={cn(me && "bg-blue-500/10")}>

                    <Td>
                      <RankMedal
                        place={r.place}
                        size="sm"
                        showBadge
                        className={me ? "bg-blue-500/30 text-blue-300 ring-blue-400/40" : undefined}
                      />
                    </Td>

                    <Td>

                      <div className="flex items-center gap-3">

                        <Avatar name={r.name} image={r.image} size="sm" />

                        <span className={cn("font-medium", me ? "text-cyan-300" : "text-slate-100")}>

                          {r.name}

                          {me && <span className="font-semibold text-cyan-400"> (Siz)</span>}

                        </span>

                      </div>

                    </Td>

                    <Td>

                      <Badge className="bg-blue-500/15 text-blue-400">Lv {r.level}</Badge>

                    </Td>

                    <Td className="text-right font-semibold text-slate-100">{fmtNumber(r.xp)}</Td>

                    <Td className="text-right text-amber-400/80">
                      <span className="inline-flex items-center justify-end gap-1">
                        <Star className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {fmtNumber(r.points)}
                      </span>
                    </Td>

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

