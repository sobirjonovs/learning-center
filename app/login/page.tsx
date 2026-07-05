import type { Metadata } from "next";
import { LoginShell } from "./login-shell";

export const metadata: Metadata = { title: "Tizimga kirish" };

export default function LoginPage() {
  return <LoginShell />;
}
