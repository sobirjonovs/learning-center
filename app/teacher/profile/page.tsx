import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfilePage } from "@/components/profile-page";
import type { Role } from "@/lib/constants";

export default async function TeacherProfilePage() {
  const session = await requireRole("TEACHER");

  const user = await db.user.findUnique({
    where: { id: session.id },
    include: {
      teacherSubjects: { include: { subject: { select: { name: true } } } },
    },
  });
  if (!user) redirect("/teacher");

  return (
    <ProfilePage
      homeHref="/teacher"
      user={{
        name: user.name,
        login: user.login,
        phone: user.phone,
        image: user.image,
        role: user.role as Role,
        createdAt: user.createdAt,
        teacherType: user.teacherType,
        subjects: user.teacherSubjects.map((ts) => ts.subject.name),
      }}
    />
  );
}
