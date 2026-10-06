"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Atom, ArrowClockwise, CloudSlash } from "@phosphor-icons/react";
import ThemeToggle from "./ThemeToggle";

export default function DatabaseUnavailable() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <main className="auth-page">
    <header className="auth-header"><div className="logo"><span className="logo-mark"><Atom size={22} weight="duotone" /></span><span>CyberQ Lab</span></div><ThemeToggle /></header>
    <div className="connection-unavailable"><section className="auth-card"><div className="auth-card-icon"><CloudSlash size={24}/></div><span className="auth-eyebrow">A BRIEF PAUSE</span><h1>We couldn’t connect</h1><p>Your workspace is temporarily unavailable. Please try again in a moment.</p><button className="auth-submit" disabled={pending} onClick={() => startTransition(() => router.refresh())}><ArrowClockwise size={17} className={pending ? "auth-spinner" : ""}/>{pending ? "Reconnecting…" : "Try again"}</button><p className="connection-note">You’ll return to your workspace when the connection is restored.</p></section></div>
  </main>;
}
