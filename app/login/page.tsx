"use client";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
export default function LoginPage() {
  const { login, error } = useAuth();
  return <div className="login"><section className="login-art"><Image className="login-app-icon" src="/kotoba.png" alt="Kotoba flower and open-book logo" width={240} height={240} priority/><p className="eyebrow" style={{color:"white"}}>Your quiet study space</p><h1>言葉<br/>ノート</h1><p>Build your Japanese vocabulary, one calm review at a time.</p></section><section className="login-form"><div className="login-box"><Image className="login-wordmark" src="/Horizontalーwordmarkーkotoba.png" alt="Kotoba ことば帖" width={320} height={160} priority/><h2>Ready to study?</h2><p>Your vocabulary and learning progress stay private in your personal account.</p><button className="btn google" onClick={login}><b style={{color:"#4285f4",fontSize:19}}>G</b> Continue with Google</button>{error && <p className="error" role="alert">{error}</p>}<p className="hint">By continuing, you’ll sign in securely with Google. We only store your vocabulary and study preferences.</p></div></section></div>;
}
