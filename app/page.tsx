"use client";
import Link from "next/link";
import { BookOpenCheck, Library, Star } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useWords } from "@/hooks/useWords";
import { isWordDue } from "@/utils/srs";
import { JLPT_LEVELS } from "@/types";

export default function HomePage() {
  const { isAdmin } = useAuth();
  const { words, loading, error } = useWords();
  const due = words.filter((word) => isWordDue(word)).length;
  const difficult = words.filter((word) => word.difficult).length;
  return <><PageHeader eyebrow="Dashboard" title="おかえりなさい" description="A little practice goes a long way." action={<span className="petal">✿</span>}/>{error && <p className="error">{error}</p>}
    <section className="grid stats"><Link href="/study?mode=due" className="stat" style={{textDecoration:"none",color:"inherit"}}><span className="icon"><BookOpenCheck size={19}/></span><strong>{loading ? "—" : due}</strong><span>Due for review</span></Link><Link href="/difficult" className="stat" style={{textDecoration:"none",color:"inherit"}}><span className="icon"><Star size={19}/></span><strong>{loading ? "—" : difficult}</strong><span>Difficult words</span></Link><Link href="/browse" className="stat" style={{textDecoration:"none",color:"inherit"}}><span className="icon"><Library size={19}/></span><strong>{loading ? "—" : words.length}</strong><span>Official words</span></Link></section>
    <div className="section-title"><h2>JLPT levels</h2>{isAdmin && <Link href="/settings" style={{color:"var(--purple)",fontSize:13,fontWeight:800}}>Manage lessons</Link>}</div>
    <section className="grid levels">{JLPT_LEVELS.map((level) => <Link className="level-card" href={`/browse?level=${level}`} key={level}><b>{level}</b><span>{words.filter((word) => word.level === level).length} words</span></Link>)}</section>
    {words.length === 0 && !loading && <div className="empty"><div className="empty-icon">🌸</div><h3>No official lessons yet</h3><p>{isAdmin ? "Publish your existing vocabulary or import a lesson from Settings." : "The lesson catalog is being prepared. Please check back soon."}</p>{isAdmin && <Link className="btn" href="/settings">Manage lessons</Link>}</div>}
  </>;
}
