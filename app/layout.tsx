import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-jp" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-ui" });
export const metadata: Metadata = {
  title: "Kotoba — JLPT Flashcards",
  applicationName: "Kotoba",
  description: "A calm, focused JLPT vocabulary notebook.",
  manifest: "/favicon_io/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kotoba" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f2ff" },
    { media: "(prefers-color-scheme: dark)", color: "#171521" },
  ],
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${noto.variable} ${nunito.variable}`}><Providers><AppShell>{children}</AppShell></Providers></body></html>;
}
