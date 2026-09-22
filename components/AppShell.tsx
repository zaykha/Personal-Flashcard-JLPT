"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "./Navigation";
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(); const path = usePathname(); const router = useRouter(); const login = path === "/login";
  useEffect(() => { if (!loading && !user && !login) router.replace("/login"); if (!loading && user && login) router.replace("/"); }, [user, loading, login, router]);
  if (loading) return <div className="screen-center"><div className="loader"/><p>Opening your notebook…</p></div>;
  if (!user && !login) return <div className="screen-center"><div className="loader"/></div>;
  if (login) return <>{children}</>;
  return <div className="app-shell"><Navigation/><main>{children}</main></div>;
}
