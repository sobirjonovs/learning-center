import { Avatar, Badge, Card, CardTitle, PageHeader } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import { fmtDateTime } from "@/lib/utils";

export type ProfilePageData = {
  name: string;
  login: string;
  phone: string | null;
  image: string | null;
  role: Role;
  createdAt: Date;
  teacherType?: string | null;
  subjects?: string[];
  permissions?: string[];
};

export function ProfilePage({
  user,
  homeHref,
}: {
  user: ProfilePageData;
  homeHref: string;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Mening profilim" subtitle="Shaxsiy ma'lumotlaringizni boshqaring" backHref={homeHref} />

      <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <Avatar name={user.name} image={user.image} size="xl" />
        <div>
          <div className="text-xl font-bold text-white">{user.name}</div>
          <div className="mt-1 text-sm text-slate-400">@{user.login}</div>
        </div>
        <Badge className="bg-blue-500/15 text-blue-400">{ROLE_LABELS[user.role]}</Badge>
        <p className="text-xs text-slate-500">Ro&apos;yxatdan o&apos;tgan: {fmtDateTime(user.createdAt)}</p>
      </div>

      {(user.teacherType || user.subjects?.length || user.permissions?.length) && (
        <Card className="mb-5">
          <CardTitle>Qo'shimcha ma'lumotlar</CardTitle>
          <dl className="space-y-2.5 text-sm">
            {user.teacherType && (
              <div className="flex justify-between gap-2">
                <dt className="text-slate-400">O&apos;qituvchi turi</dt>
                <dd className="font-medium text-slate-200">{user.teacherType}</dd>
              </div>
            )}
            {user.subjects && user.subjects.length > 0 && (
              <div>
                <dt className="mb-1.5 text-slate-400">Fan kategoriyalari</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {user.subjects.map((s) => (
                    <Badge key={s} className="bg-violet-500/15 text-violet-400">
                      {s}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {user.permissions && user.permissions.length > 0 && (
              <div>
                <dt className="mb-1.5 text-slate-400">Huquqlar</dt>
                <dd className="text-xs text-slate-500">
                  Huquqlarni faqat super admin o&apos;zgartira oladi.
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card>
        <CardTitle>Ma&apos;lumotlarni tahrirlash</CardTitle>
        <ProfileForm
          key={`${user.login}-${user.name}-${user.image ?? ""}-${user.phone ?? ""}`}
          user={{
            name: user.name,
            login: user.login,
            phone: user.phone,
            image: user.image,
          }}
        />
      </Card>
    </div>
  );
}
