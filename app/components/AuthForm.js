"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Atom, ArrowRight, BookOpen, Check, Eye, EyeSlash, Key, LockKey, ShieldCheck, Sparkle, User, Envelope, CircleNotch, WarningCircle } from "@phosphor-icons/react";

function GoogleMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.87h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.35Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.08 12c0-.66.11-1.3.32-1.9V7.51H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.49L6.4 13.9Z"/><path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.51L6.4 10.1C7.19 7.73 9.4 5.97 12 5.97Z"/></svg>;
}

export default function AuthForm({ mode, oauthError = "" }) {
  const signup = mode === "signup";
  const router = useRouter();
  const formRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");

  useEffect(() => {
    if (errorField && !pending) formRef.current?.elements.namedItem(errorField)?.focus();
  }, [errorField, pending]);

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError("");
    setErrorField("");
    setPending(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setErrorField(result.field || "");
        setPending(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("We couldn’t reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  const fieldProps = (name) => ({ "aria-invalid": errorField === name, "aria-describedby": errorField === name ? "auth-error" : undefined });

  return <main className="auth-page">
    <header className="auth-header">
      <Link className="logo" href="/login" aria-label="CyberQ Lab home"><span className="logo-mark"><Atom size={22} weight="duotone" /></span><span>CyberQ Lab</span></Link>
      <div className="auth-header-actions"><span>Quantum ideas. Real understanding.</span></div>
    </header>
    <div className="auth-layout">
      <section className="auth-story" aria-label="About CyberQ Lab">
        <div className="auth-story-tag"><Sparkle size={14} weight="fill" /> YOUR QUANTUM LEARNING SPACE</div>
        <h1>Understand today’s security.<br /><span>Explore what’s next.</span></h1>
        <p>A hands-on path through cryptography, quantum computing, and the ideas shaping a safer digital world.</p>
        <div className="auth-orbit" aria-hidden="true">
          <div className="auth-orbit-ring ring-one" /><div className="auth-orbit-ring ring-two" /><div className="auth-orbit-ring ring-three" />
          <div className="auth-orbit-core"><Atom size={62} weight="duotone" /></div>
          <span className="auth-orbit-node node-key"><Key size={22} /></span>
          <span className="auth-orbit-node node-shield"><ShieldCheck size={24} /></span>
          <span className="auth-orbit-node node-book"><BookOpen size={21} /></span>
          <span className="auth-orbit-caption"><span /> A new perspective on security</span>
        </div>
        <div className="auth-story-features">
          <div><span><BookOpen size={18} /></span><div><b>Build your foundations</b><p>Clear lessons, one concept at a time.</p></div></div>
          <div><span><Atom size={18} /></span><div><b>Learn by experimenting</b><p>Interactive algorithms and quantum attacks.</p></div></div>
          <div><span><ShieldCheck size={18} /></span><div><b>Explore quantum-safe security</b><p>Discover the next generation of cryptography.</p></div></div>
        </div>
        <div className="auth-story-footer"><span className="auth-story-line" /> CURIOSITY IS YOUR STARTING POINT</div>
      </section>
      <section className="auth-form-panel" aria-labelledby="auth-heading">
        <div className="auth-card">
          <div className="auth-card-icon">{signup ? <User size={23} weight="duotone" /> : <LockKey size={23} weight="duotone" />}</div>
          <span className="auth-eyebrow">{signup ? "START YOUR JOURNEY" : "YOUR LEARNING CONTINUES"}</span>
          <h2 id="auth-heading">{signup ? "Create your account" : "Welcome back"}</h2>
          <p className="auth-subtitle">{signup ? "A little curiosity goes a long way. Let’s get started." : "Sign in to explore your quantum learning workspace."}</p>
          <div className="auth-tabs" aria-label="Account options"><Link href="/login" className={!signup ? "active" : ""} aria-current={!signup ? "page" : undefined}>Log in</Link><Link href="/signup" className={signup ? "active" : ""} aria-current={signup ? "page" : undefined}>Sign up</Link></div>
          {oauthError && <div className="auth-error auth-oauth-error" role="alert"><WarningCircle size={18}/><span>{oauthError}</span></div>}
          <a className="auth-google" href="/api/auth/google"><GoogleMark/><span>{signup ? "Sign up with Google" : "Continue with Google"}</span></a>
          <div className="auth-divider"><span>or continue with email</span></div>
          <form ref={formRef} onSubmit={submit} className="auth-form" aria-busy={pending}>
            {signup && <label className="auth-field"><span>Full name</span><div className="auth-input"><User size={18} aria-hidden="true" /><input name="name" autoComplete="name" placeholder="Your name" minLength={2} maxLength={80} required disabled={pending} {...fieldProps("name")} /></div></label>}
            <label className="auth-field"><span>Email address</span><div className="auth-input"><Envelope size={18} aria-hidden="true" /><input name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" maxLength={254} required disabled={pending} {...fieldProps("email")} /></div></label>
            <label className="auth-field"><span id="password-label">Password</span><div className="auth-input"><LockKey size={18} aria-hidden="true" /><input aria-labelledby="password-label" name="password" type={showPassword ? "text" : "password"} autoComplete={signup ? "new-password" : "current-password"} placeholder={signup ? "Create a strong password" : "Enter your password"} minLength={signup ? 12 : undefined} maxLength={128} required disabled={pending} {...fieldProps("password")} aria-describedby={errorField === "password" ? "auth-error" : signup ? "password-hint" : undefined} /><button className="auth-password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}</button></div>{signup && <small id="password-hint">Use at least 12 characters. A memorable phrase works well.</small>}</label>
            {signup && <label className="auth-field"><span>Confirm password</span><div className="auth-input"><Check size={18} aria-hidden="true" /><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Enter your password again" maxLength={128} required disabled={pending} {...fieldProps("confirmPassword")} /></div></label>}
            {error && <div className="auth-error" id="auth-error" role="alert"><WarningCircle size={18} /><span>{error}</span></div>}
            <button className="auth-submit" disabled={pending} type="submit">{pending ? <><CircleNotch size={18} className="auth-spinner" />{signup ? "Creating your account…" : "Signing you in…"}</> : <>{signup ? "Create account" : "Log in"}<ArrowRight size={17} /></>}</button>
          </form>
          <p className="auth-switch">{signup ? "Already have an account?" : "New to CyberQ Lab?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Log in" : "Create an account"}<ArrowRight size={13} /></Link></p>
          <div className="auth-trust"><ShieldCheck size={15} /> Your next discovery starts here.</div>
        </div>
        <footer className="auth-footer">CyberQ Lab <span>·</span> Learn. Experiment. Understand.</footer>
      </section>
    </div>
  </main>;
}
