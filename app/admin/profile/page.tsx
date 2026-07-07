import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfilePage } from "@/components/profile-page";
import { parseJsonArray } from "@/lib/utils";
import type { Role } from "@/lib/constants";

export default async function AdminProfilePage() {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");

  const user = await db.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/admin");

  return (
    <ProfilePage
      homeHref="/admin"
      user={{
        name: user.name,
        login: user.login,
        phone: user.phone,
        image: user.image,
        role: user.role as Role,
        createdAt: user.createdAt,
        permissions:
          user.role === "ADMIN" ? parseJsonArray<string>(user.permissions) : undefined,
      }}
    />
  );
}
