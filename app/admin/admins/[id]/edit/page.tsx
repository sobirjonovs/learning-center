// Administratorni tahrirlash (faqat SUPER_ADMIN)
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
import { PageHeader, Card } from "@/components/ui";
import { AdminForm } from "../../admin-form";

export default async function EditAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const admin = await db.user.findUnique({ where: { id } });
  if (!admin || admin.role !== "ADMIN") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Administratorni tahrirlash"
        subtitle={admin.name}
        backHref="/admin/admins"
      />
      <Card>
        <AdminForm
          error={error}
          admin={{
            id: admin.id,
            name: admin.name,
            login: admin.login,
            phone: admin.phone,
            active: admin.active,
            permissions: parseJsonArray(admin.permissions),
          }}
        />
      </Card>
    </div>
  );
}
