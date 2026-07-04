"use client";

// Bildirishnoma yaratish/tahrirlash formasi
import { useState } from "react";
import { Field, inputCls, btn } from "@/components/ui";
import {
  NOTIFICATION_AUDIENCE,
  ROLE_LABELS,
  type NotificationAudience,
} from "@/lib/constants";
import { saveNotification } from "./actions";

export type GroupOption = { id: string; name: string };
export type UserOption = { id: string; name: string; role: "STUDENT" | "TEACHER" };

export type NotificationFormData = {
  id: string;
  title: string;
  body: string;
  image: string | null;
  audience: string;
  groupId: string | null;
  scheduledAt: string; // datetime-local qiymati yoki ""
  recipientIds: string[];
};

export function NotificationForm({
  groups,
  users,
  notification,
}: {
  groups: GroupOption[];
  users: UserOption[];
  notification?: NotificationFormData;
}) {
  const [audience, setAudience] = useState<NotificationAudience>(
    (notification?.audience as NotificationAudience) ?? "ALL_STUDENTS"
  );

  const students = users.filter((u) => u.role === "STUDENT");
  const teachers = users.filter((u) => u.role === "TEACHER");

  const validate = (e: React.MouseEvent<HTMLButtonElement>, needsDate: boolean) => {
    const form = e.currentTarget.form;
    if (!form) return;
    if (audience === "CUSTOM") {
      const checked = form.querySelectorAll('input[name="userIds"]:checked').length;
      if (checked === 0) {
        e.preventDefault();
        alert("Kamida bitta qabul qiluvchini tanlang");
        return;
      }
    }
    if (needsDate) {
      const input = form.elements.namedItem("scheduledAt") as HTMLInputElement | null;
      if (!input?.value) {
        e.preventDefault();
        alert("Rejalashtirish uchun sana va vaqtni kiriting");
      }
    }
  };

  const checkboxCls =
    "h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500";

  return (
    <form action={saveNotification} className="space-y-4">
      {notification && <input type="hidden" name="id" value={notification.id} />}

      <Field label="Nomi" required>
        <input
          name="title"
          required
          defaultValue={notification?.title ?? ""}
          placeholder="Bildirishnoma sarlavhasi"
          className={inputCls}
        />
      </Field>

      <Field label="Matni" required>
        <textarea
          name="body"
          required
          rows={4}
          defaultValue={notification?.body ?? ""}
          placeholder="Bildirishnoma matni"
          className={inputCls}
        />
      </Field>

      <Field label="Rasm">
        <div className="space-y-2">
          {notification?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={notification.image}
              alt="Joriy rasm"
              className="h-20 w-20 rounded-xl border border-slate-100 object-cover"
            />
          )}
          <input type="file" name="image" accept="image/*" className={inputCls} />
        </div>
      </Field>

      <Field label="Qabul qiluvchilar" required>
        <select
          name="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value as NotificationAudience)}
          className={inputCls}
        >
          {(Object.keys(NOTIFICATION_AUDIENCE) as NotificationAudience[]).map((k) => (
            <option key={k} value={k}>
              {NOTIFICATION_AUDIENCE[k].label}
            </option>
          ))}
        </select>
      </Field>

      {audience === "GROUP" && (
        <Field label="Guruh" required>
          <select
            name="groupId"
            required
            defaultValue={notification?.groupId ?? ""}
            className={inputCls}
          >
            <option value="" disabled>
              Guruhni tanlang
            </option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {audience === "CUSTOM" && (
        <Field label="Foydalanuvchilarni tanlang" required>
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            {[
              { label: ROLE_LABELS.STUDENT + "lar", list: students },
              { label: ROLE_LABELS.TEACHER + "lar", list: teachers },
            ].map(
              (section) =>
                section.list.length > 0 && (
                  <div key={section.label}>
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {section.label}
                    </div>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {section.list.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            name="userIds"
                            value={u.id}
                            defaultChecked={notification?.recipientIds.includes(u.id)}
                            className={checkboxCls}
                          />
                          {u.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        </Field>
      )}

      <Field label="Rejalashtirilgan vaqt">
        <input
          type="datetime-local"
          name="scheduledAt"
          defaultValue={notification?.scheduledAt ?? ""}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-slate-400">
          &quot;Rejalashtirish&quot; tugmasi uchun to&apos;ldiriladi — belgilangan vaqtda avtomatik yuboriladi.
        </p>
      </Field>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
        <button
          type="submit"
          name="intent"
          value="draft"
          onClick={(e) => validate(e, false)}
          className={btn.ghost}
        >
          Qoralama sifatida saqlash
        </button>
        <button
          type="submit"
          name="intent"
          value="schedule"
          onClick={(e) => validate(e, true)}
          className={btn.secondary}
        >
          Rejalashtirish
        </button>
        <button
          type="submit"
          name="intent"
          value="send"
          onClick={(e) => validate(e, false)}
          className={btn.primary}
        >
          Darhol yuborish
        </button>
      </div>
    </form>
  );
}
