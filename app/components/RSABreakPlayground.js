"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Key, LockKey, Pause, Play } from "@phosphor-icons/react";
import RSAValue, { RSALegend } from "./RSAValue";
import { modPow, recoverRSA } from "./rsa.mjs";

const captions = [
  "The attacker starts with the public key and ciphertext. The factors and private exponent are unknown.",
  "Choose a base a coprime to n. Its modular powers repeat in a cycle.",
  "Find r, the smallest positive exponent that returns to 1. Quantum order finding is the key subroutine in Shor’s algorithm.",
  "For a useful even period, the half-period produces a nontrivial square root of 1 modulo n.",
  "Take two greatest common divisors to recover the secret factors p and q.",
  "With the factors exposed, compute the totient just as the key’s owner did.",
  "Invert the public exponent modulo the totient. The private key is now recovered.",
  "Use the recovered private key to decrypt the intercepted ciphertext.",
];

function Line({ number, title, children }) {
  return <div className="rsa-line"><span className="rsa-line-number">{number}</span><div><small>{title}</small>{children}</div></div>;
}

export default function RSABreakPlayground({ n, e, firstPrime, onEdit }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");
  const [message, setMessage] = useState(String(Math.min(65, (n || 66) - 1)));
  const recovered = useMemo(() => recoverRSA(n, e), [n, e]);
  const { a, r, x, phi, d, attempts = [] } = recovered;
  // Factor order is interchangeable. Use the original naming only for display,
  // after recoverRSA has independently recovered both factors from public data.
  const swapped = recovered.q === firstPrime;
  const p = swapped ? recovered.q : recovered.p;
  const q = swapped ? recovered.p : recovered.q;
  const m = Number(message);
  const error = recovered.error || (message.trim() === "" || !Number.isInteger(m) || m < 0 || m >= n ? `Enter a whole-number message from 0 to ${n - 1}.` : "");
  const cipher = error ? null : modPow(m, e, n);
  const decrypted = error ? null : modPow(cipher, d, n);
  const samplePowers = useMemo(() => {
    if (!r) return [];
    const indices = r <= 8 ? Array.from({ length: r + 1 }, (_, i) => i) : [0, 1, 2, 3, r - 1, r, r + 1];
    return indices.map(index => ({ index, value: modPow(a, index, n) }));
  }, [a, r, n]);

  useEffect(() => {
    if (!playing || error) return;
    const timer = window.setTimeout(() => {
      if (step >= 6) setPlaying(false);
      setStep(value => Math.min(7, value + 1));
    }, 2600 / Number(speed));
    return () => window.clearTimeout(timer);
  }, [playing, step, speed, error]);

  function reset() { setStep(0); setPlaying(false); }
  function move(next) { setPlaying(false); setStep(next); }

  return <>
    <div className="rsa-playground rsa-break">
      <div className="rsa-inputs">
        <div className="rsa-input-intro"><b>Prepare a toy ciphertext</b><span>Encrypt a number with your public key.</span></div>
        <label className="rsa-color-m">Message m<input type="number" min="0" max={n ? n - 1 : 0} step="1" value={message} onChange={event => { reset(); setMessage(event.target.value); }} aria-invalid={!!error} aria-describedby={error ? "rsa-break-error" : undefined}/></label>
        <div className="rsa-cipher-preview"><small>c = mᵉ mod n</small><strong><RSAValue kind="c">{cipher ?? "—"}</RSAValue></strong></div>
        <button className="rsa-example" onClick={onEdit}>Edit primes</button>
      </div>
      {error && <p className="rsa-error" id="rsa-break-error" role="alert">{error}</p>}
      <RSALegend attack/>
      <div className="rsa-board">
        <div className="rsa-board-heading"><span><i/> ATTACKER’S WHITEBOARD</span><span>SHOR’S IDEA / {String(step + 1).padStart(2, "0")}</span></div>
        <div className="rsa-attack-known"><div><small>PUBLIC KEY</small><strong>(e, n) = (<RSAValue kind="e">{e ?? "?"}</RSAValue>, <RSAValue kind="n">{n ?? "?"}</RSAValue>)</strong></div><div><small>INTERCEPTED</small><strong>c = <RSAValue kind="c">{cipher ?? "?"}</RSAValue></strong></div><div className={step >= 6 ? "exposed" : ""}><small>{step >= 6 ? "RECOVERED" : "UNKNOWN"}</small><strong>d = <RSAValue kind="d">{step >= 6 ? d : "?"}</RSAValue></strong></div></div>
        <div className="rsa-lines" aria-live="polite" aria-atomic="false">
          {step === 0 && <div className="rsa-board-empty"><span>Can we work backwards from n?</span><p>p = ? &nbsp; · &nbsp; q = ? &nbsp; · &nbsp; d = ?</p><span className="rsa-sketch-arrow">↓</span></div>}
          {step >= 1 && <Line number="01" title="CHOOSE A COPRIME BASE"><div className="rsa-equation">a = <strong><RSAValue kind="a">{a}</RSAValue></strong><span className="rsa-equation-detail">gcd(<RSAValue kind="a">{a}</RSAValue>, <RSAValue kind="n">{n}</RSAValue>) = 1</span></div><p className="rsa-break-note">f(x) = <RSAValue kind="a">{a}</RSAValue><sup>x</sup> mod <RSAValue kind="n">{n}</RSAValue></p>{attempts.length > 0 && <details className="rsa-retries"><summary>{attempts.length} earlier base{attempts.length === 1 ? "" : "s"} skipped</summary>{attempts.map(attempt => <p key={attempt.a}>a = {attempt.a}: {attempt.reason}</p>)}</details>}</Line>}
          {step >= 2 && <Line number="02" title="FIND THE REPEATING PERIOD"><div className="rsa-equation"><RSAValue kind="a">{a}</RSAValue><sup><RSAValue kind="r">{r}</RSAValue></sup> mod <RSAValue kind="n">{n}</RSAValue> = 1 <strong>→ r = <RSAValue kind="r">{r}</RSAValue></strong></div><div className="rsa-period-strip">{samplePowers.map(({ index, value }, i) => <div className="rsa-period-item" key={index}>{i > 0 && index - samplePowers[i - 1].index > 1 && <span className="rsa-period-gap">…</span>}<div className={value === 1 ? "repeat" : ""}><small>x = {index}</small><strong>{value}</strong></div></div>)}</div><p className="rsa-break-note">Highlighted 1s mark a full cycle. {r > 8 ? "Selected powers shown; the middle is omitted. " : ""}This browser finds the period classically; Shor uses quantum order finding.</p></Line>}
          {step >= 3 && <Line number="03" title="USE HALF THE PERIOD"><div className="rsa-equation">x = <RSAValue kind="a">{a}</RSAValue><sup><RSAValue kind="r">{r}</RSAValue> / 2</sup> mod <RSAValue kind="n">{n}</RSAValue><strong> = <RSAValue kind="x">{x}</RSAValue></strong></div><p className="rsa-check"><Check size={13}/> r is even · x ≠ 1 · x ≠ {n - 1}</p></Line>}
          {step >= 4 && <Line number="04" title="SPLIT THE PUBLIC MODULUS"><div className="rsa-equation">p = gcd(<RSAValue kind="x">{x}</RSAValue> {swapped ? "+" : "−"} 1, <RSAValue kind="n">{n}</RSAValue>)<strong> = <RSAValue kind="p">{p}</RSAValue></strong></div><div className="rsa-equation">q = gcd(<RSAValue kind="x">{x}</RSAValue> {swapped ? "−" : "+"} 1, <RSAValue kind="n">{n}</RSAValue>)<strong> = <RSAValue kind="q">{q}</RSAValue></strong></div><div className="rsa-factor-split"><span><RSAValue kind="n">{n}</RSAValue></span><span>→</span><strong><RSAValue kind="p">{p}</RSAValue></strong><span>×</span><strong><RSAValue kind="q">{q}</RSAValue></strong></div></Line>}
          {step >= 5 && <Line number="05" title="REBUILD THE TOTIENT"><div className="rsa-equation">φ(n) = (<RSAValue kind="p">{p}</RSAValue> − 1) × (<RSAValue kind="q">{q}</RSAValue> − 1)<strong> = <RSAValue kind="phi">{phi}</RSAValue></strong></div></Line>}
          {step >= 6 && <Line number="06" title="RECOVER THE PRIVATE EXPONENT"><div className="rsa-equation">d = <RSAValue kind="e">{e}</RSAValue><sup>−1</sup> mod <RSAValue kind="phi">{phi}</RSAValue><strong> = <RSAValue kind="d">{d}</RSAValue></strong></div><p className="rsa-check"><Check size={13}/> <RSAValue kind="e">{e}</RSAValue> × <RSAValue kind="d">{d}</RSAValue> mod <RSAValue kind="phi">{phi}</RSAValue> = 1</p></Line>}
          {step >= 7 && <Line number="07" title="DECRYPT THE INTERCEPTED MESSAGE"><div className="rsa-equation">m = <RSAValue kind="c">{cipher}</RSAValue><sup><RSAValue kind="d">{d}</RSAValue></sup> mod <RSAValue kind="n">{n}</RSAValue><strong className="rsa-answer"> = <RSAValue kind="m">{decrypted}</RSAValue></strong></div><p className="rsa-check"><Check size={13}/> Recovered message matches the original: <RSAValue kind="m">{m}</RSAValue></p></Line>}
        </div>
        {step >= 6 && <div className="rsa-key-result"><div className="rsa-key-branches" aria-hidden="true"><span>↙</span><small>The secret is recovered</small><span>↘</span></div><div className="rsa-keys"><article className="rsa-key public"><div><Key size={21}/><span>PUBLIC KEY<small>Known from the beginning</small></span></div><strong>(e, n) = (<RSAValue kind="e">{e}</RSAValue>, <RSAValue kind="n">{n}</RSAValue>)</strong></article><article className="rsa-key private"><div><LockKey size={21}/><span>RECOVERED PRIVATE KEY<small>Derived from the factors</small></span></div><strong>(d, n) = (<RSAValue kind="d">{d}</RSAValue>, <RSAValue kind="n">{n}</RSAValue>)</strong></article></div></div>}
        <div className="rsa-caption" role="status"><span>{String(step + 1).padStart(2, "0")} / 08</span><p>{error || captions[step]}</p></div>
      </div>
      <div className="rsa-controls"><div className="rsa-playback"><button className="rsa-play" disabled={!!error} onClick={() => { if (step === 7) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} weight="fill"/> : <Play size={15} weight="fill"/>}{playing ? "Pause" : step === 7 ? "Replay attack" : "Play break flow"}</button><button className="rsa-reset" onClick={reset} aria-label="Reset break animation"><ArrowCounterClockwise size={17}/></button><label className="rsa-speed">Speed<select value={speed} onChange={event => setSpeed(event.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div><div className="rsa-step-actions"><button disabled={step === 0 || !!error} onClick={() => move(step - 1)} aria-label="Previous attack calculation"><CaretLeft size={15}/></button><span>Line by line</span><button disabled={step === 7 || !!error} onClick={() => move(step + 1)} aria-label="Next attack calculation"><CaretRight size={15}/></button></div></div>
      <p className="rsa-footnote">Toy, unpadded RSA · Classical period simulation · <a href="https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms/phase-estimation-and-factoring/shor-algorithm" target="_blank" rel="noreferrer">How Shor’s algorithm works ↗</a></p>
    </div>
  </>;
}
