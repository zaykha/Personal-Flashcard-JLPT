"use client";
import { AuthProvider } from "@/hooks/useAuth";
import { WordsProvider } from "@/hooks/useWords";
import { useSettings } from "@/hooks/useSettings";
function ThemeSync(){ useSettings(); return null; }
export function Providers({ children }: { children: React.ReactNode }) { return <AuthProvider><ThemeSync/><WordsProvider>{children}</WordsProvider></AuthProvider>; }
