// Administrator yaratish/tahrirlash formasi
import { Field, inputCls, btn } from "@/components/ui";
import { PERMISSIONS } from "@/lib/constants";
import { createAdmin, updateAdmin } from "./actions";

type AdminData = {
  id: string;
  name: string;
  login: string;
  phone: string | null;
  active: boolean;
  permissions: string[];
};

const checkboxCls =
  "h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500";

export function AdminForm({ admin, error }: { admin?: AdminData; error?: string }) {
  return (
    <form action={admin ? updateAdmin : createAdmin} className="space-y-4">
      {admin && <input type="hidden" name="id" value={admin.id} />}

      {error === "login" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          Bu login band — boshqa login tanlang.
        </div>
      )}

      <Field label="F.I.Sh" required>
        <input
          name="name"
          required
          defaultValue={admin?.name ?? ""}
          placeholder="Familiya Ism Sharif"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Login" required>
          <input
            name="login"
            required
            defaultValue={admin?.login ?? ""}
            placeholder="admin.login"
            className={inputCls}
          />
        </Field>
        <Field label={admin ? "Yangi parol" : "Parol"} required={!admin}>
          <input
            type="password"
            name="password"
            required={!admin}
            minLength={6}
            placeholder={admin ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Kamida 6 ta belgi"}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Telefon">
        <input
          name="phone"
          defaultValue={admin?.phone ?? ""}
          placeholder="+998 90 123 45 67"
          className={inputCls}
        />
      </Field>

      <Field label="Huquqlar">
        <div className="grid gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
          {PERMISSIONS.map((p) => (
            <label
              key={p.key}
              className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-white"
            >
              <input
                type="checkbox"
                name="permissions"
                value={p.key}
                defaultChecked={admin?.permissions.includes(p.key)}
                className={checkboxCls}
              />
              {p.label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          Huquq o&apos;zgarishlari administrator qayta kirganda kuchga kiradi.
        </p>
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={admin?.active ?? true}
          className={checkboxCls}
        />
        Faol (tizimga kira oladi)
      </label>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button type="submit" className={btn.primary}>
          {admin ? "Saqlash" : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}
