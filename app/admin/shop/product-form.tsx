// Mahsulot yaratish/tahrirlash formasi (Modal ichida ishlatiladi)
import { Field, inputCls, btn } from "@/components/ui";
import { createProduct, updateProduct } from "./actions";

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  active: boolean;
};

export function ProductForm({ product }: { product?: ProductData }) {
  return (
    <form action={product ? updateProduct : createProduct} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <Field label="Nomi" required>
        <input
          name="name"
          required
          defaultValue={product?.name ?? ""}
          placeholder="Masalan: Firmennaya futbolka"
          className={inputCls}
        />
      </Field>
      <Field label="Tavsifi">
        <textarea
          name="description"
          rows={3}
          defaultValue={product?.description ?? ""}
          placeholder="Mahsulot haqida qisqacha ma'lumot"
          className={inputCls}
        />
      </Field>
      <Field label="Rasm">
        <input type="file" name="image" accept="image/*" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Ball qiymati" required>
          <input
            type="number"
            name="price"
            required
            min={0}
            defaultValue={product?.price ?? ""}
            placeholder="500"
            className={inputCls}
          />
        </Field>
        <Field label="Ombordagi soni" required>
          <input
            type="number"
            name="stock"
            required
            min={0}
            defaultValue={product?.stock ?? ""}
            placeholder="10"
            className={inputCls}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? true}
          className="h-4 w-4 rounded border-slate-300 text-blue-400 focus:ring-indigo-500"
        />
        Faol (o'quvchilarga ko'rinadi)
      </label>
      <div className="flex justify-end">
        <button type="submit" className={btn.primary}>
          {product ? "Saqlash" : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}
