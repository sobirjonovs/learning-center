import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Tizimga kirish" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl backdrop-blur animate-float">
            🎓
          </div>
          <h1 className="text-3xl font-bold tracking-tight">EduCenter</h1>
          <p className="mt-1 text-sm text-indigo-100">
            O'quv markaz boshqaruv platformasi
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-indigo-100/80">
          Kirish uchun login va parolni administratsiyadan oling
        </p>
      </div>
    </main>
  );
}
