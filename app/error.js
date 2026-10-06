"use client";

export default function ErrorPage({ reset }) {
  return <main className="auth-unavailable"><section className="auth-card"><h1>Let’s try that again</h1><p>We couldn’t load your workspace. Please check your connection and try again.</p><button className="auth-submit" onClick={reset}>Try again</button></section></main>;
}
