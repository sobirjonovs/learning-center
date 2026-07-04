"use client";

/** Tasdiq so'raydigan submit tugma (o'chirish kabi xavfli amallar uchun). */
export function ConfirmButton({
  message = "Ishonchingiz komilmi?",
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
