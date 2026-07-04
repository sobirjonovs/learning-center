import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "EduCenter — O'quv markaz boshqaruv platformasi",
    template: "%s | EduCenter",
  },
  description:
    "O'quv markaz faoliyatini boshqarish, davomat, uyga vazifalar, quiz va gamifikatsiya platformasi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
