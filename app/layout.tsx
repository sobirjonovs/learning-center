import type { Metadata } from "next";
import { Orbitron, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { UrlToast } from "@/components/url-toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "EduCenter — O'quv markaz boshqaruv platformasi",
    template: "%s | EduCenter",
  },
  description:
    "O'quv markaz faoliyatini boshqarish, davomat, uyga vazifalar, quiz va gamifikatsiya platformasi",
};

const themeInitScript = `(function(){try{var k="educenter-theme",s=localStorage.getItem(k),d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className={`${jakarta.variable} ${orbitron.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={jakarta.className}>
        <ThemeProvider>
          <ToastProvider>
            <UrlToast />
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
