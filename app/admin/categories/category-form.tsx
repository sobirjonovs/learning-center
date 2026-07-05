// Fan kategoriyasi yaratish/tahrirlash formasi
import { Field, inputCls, btn } from "@/components/ui";
import { createCategory, updateCategory } from "./actions";

type CategoryData = {
  id: string;
  name: string;
  active: boolean;
};

export function CategoryForm({ category }: { category?: CategoryData }) {
  return (
    <form action={category ? updateCategory : createCategory} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Field label="Kategoriya nomi" required>
        <input
          name="name"
          required
          defaultValue={category?.name ?? ""}
          placeholder="Masalan: Matematika"
          className={inputCls}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="active"
          defaultChecked={category?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        Faol (o'qituvchi va guruhlarga biriktirish mumkin)
      </label>
      <div className="flex justify-end">
        <button type="submit" className={btn.primary}>
          {category ? "Saqlash" : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}
