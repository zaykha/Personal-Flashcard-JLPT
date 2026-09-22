"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Import, Library, Settings, Star } from "lucide-react";
const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/browse", label: "Browse", icon: Library },
  { href: "/difficult", label: "Difficult", icon: Star },
  { href: "/import", label: "Import", icon: Import },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function Navigation() {
  const path = usePathname();
  return <><aside className="sidebar"><Link href="/" className="brand" aria-label="Kotoba home"><Image className="brand-logo" src="/kotoba.png" alt="" width={48} height={48} priority/><div>Kotoba<small>ことば帖</small></div></Link><nav>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={path === href ? "active" : ""}><Icon size={20}/><span>{label}</span></Link>)}</nav><p className="sidebar-quote">一歩ずつ<br/><span>One word at a time.</span></p></aside><nav className="bottom-nav" aria-label="Main navigation">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={path === href ? "active" : ""}><Icon size={21}/><span>{label}</span></Link>)}</nav></>;
}
