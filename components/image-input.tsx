// Rasm yuklash: havola yoki fayl (formalar uchun umumiy komponent)
import { inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";

export function ImageInput({
  currentImage,
  className,
  previewClassName,
}: {
  currentImage?: string | null;
  className?: string;
  previewClassName?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {currentImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentImage}
          alt="Joriy rasm"
          className={cn(
            "h-20 w-32 rounded-xl border border-white/10 object-cover classic:border-slate-200",
            previewClassName
          )}
        />
      )}
      <div className="space-y-2">
        <input
          type="url"
          name="imageUrl"
          placeholder="https://example.com/rasm.jpg"
          className={inputCls}
        />
        <p className="text-center text-xs text-slate-400">yoki</p>
        <input type="file" name="image" accept="image/*" className={inputCls} />
      </div>
      <p className="text-xs text-slate-400">
        Rasm havolasini kiriting yoki kompyuterdan fayl tanlang.
      </p>
    </div>
  );
}
