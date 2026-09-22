import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-jp" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-ui" });
export const metadata: Metadata = { title: "Kotoba — JLPT Flashcards", description: "A calm, focused JLPT vocabulary notebook." };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f2ff" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={`${noto.variable} ${nunito.variable}`}><Providers><AppShell>{children}</AppShell></Providers></body></html>; }
