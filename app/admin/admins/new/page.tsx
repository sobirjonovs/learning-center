// Yangi administrator qo'shish (faqat SUPER_ADMIN)
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { AdminForm } from "../admin-form";

export default async function NewAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN");
  if (session.role !== "SUPER_ADMIN") redirect("/admin");

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yangi administrator"
        subtitle="Administrator ma'lumotlari va huquqlarini belgilang"
        backHref="/admin/admins"
      />
      <Card>
        <AdminForm error={error} />
      </Card>
    </div>
  );
}
