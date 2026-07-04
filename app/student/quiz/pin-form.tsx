"use client";

// 6 xonali PIN kiritish formasi
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PinForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6 || loading) return;
    setLoading(true);
    router.push(`/student/quiz/play/${pin}`);
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="000000"
        aria-label="Game PIN"
        className="w-full rounded-2xl border-0 bg-white/95 px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.5em] text-slate-900 placeholder-slate-300 shadow-inner outline-none ring-4 ring-transparent transition focus:ring-white/40"
      />
      <button
        type="submit"
        disabled={pin.length !== 6 || loading}
        className="w-full rounded-2xl bg-slate-900/90 px-4 py-4 text-lg font-black text-white shadow-lg transition hover:bg-slate-900 active:scale-[0.98] disabled:opacity-40"
      >
        {loading ? "Ulanmoqda..." : "Qo'shilish 🚀"}
      </button>
    </form>
  );
}
