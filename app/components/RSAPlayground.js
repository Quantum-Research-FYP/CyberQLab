"use client";

import { useEffect, useState } from "react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Key, LockKey, Pause, Play } from "@phosphor-icons/react";
import RSAValue, { RSALegend } from "./RSAValue";
import { createRSA } from "./rsa.mjs";

const captions = [
  "Choose two different prime numbers to begin.",
  "Bring p and q together. Multiply them to make the modulus.",
  "This is n: the modulus shared by both keys.",
  "Subtract one from each prime, then multiply to find φ(n).",
  "Choose e so that 1 < e < φ(n) and gcd(e, φ(n)) = 1.",
  "Find d, the modular inverse of e: e × d leaves remainder 1 modulo φ(n).",
  "Your key pair is ready. Both keys use the same modulus n.",
];

export default function RSAPlayground({ p, q, setP, setQ, onBreak }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");
  const values = createRSA(p, q);
  const { n, phi, e, d, error } = values;

  useEffect(() => {
    if (!playing || error) return;
    const timer = window.setTimeout(() => {
      if (step >= 5) setPlaying(false);
      setStep(value => Math.min(6, value + 1));
    }, 2200 / Number(speed));
    return () => window.clearTimeout(timer);
  }, [playing, step, speed, error]);

  function reset() { setStep(0); setPlaying(false); }
  function edit(setter, value) { reset(); setter(value); }
  function move(value) { setPlaying(false); setStep(value); }

  return <div className="rsa-playground">
    <div className="rsa-inputs">
      <div className="rsa-input-intro"><b>Start with two primes</b><span>Change the numbers. Watch the math.</span></div>
      <label className="rsa-color-p">Prime p<input type="number" min="3" max="997" step="1" value={p} onChange={event => edit(setP, event.target.value)} aria-invalid={!!error} aria-describedby={error ? "rsa-error" : undefined}/></label>
      <span className="rsa-input-times">×</span>
      <label className="rsa-color-q">Prime q<input type="number" min="3" max="997" step="1" value={q} onChange={event => edit(setQ, event.target.value)} aria-invalid={!!error} aria-describedby={error ? "rsa-error" : undefined}/></label>
      <button className="rsa-example" onClick={() => { reset(); setP("61"); setQ("53"); }}>Load example</button>
    </div>
    {error && <p className="rsa-error" id="rsa-error" role="alert">{error}</p>}

    <RSALegend/>
    <div className="rsa-board">
      <div className="rsa-board-heading"><span><i/> RSA WHITEBOARD</span><span>KEY GENERATION / {String(step + 1).padStart(2, "0")}</span></div>
      <div className="rsa-prime-flow">
        <div className={`rsa-prime p ${step >= 1 ? "combined" : ""}`}><span>p</span><strong><RSAValue kind="p">{values.p || "?"}</RSAValue></strong><small>first prime</small></div>
        <span className={`rsa-multiply ${step >= 1 ? "visible" : ""}`}>×</span>
        <div className={`rsa-prime q ${step >= 1 ? "combined" : ""}`}><span>q</span><strong><RSAValue kind="q">{values.q || "?"}</RSAValue></strong><small>second prime</small></div>
      </div>

      <div className="rsa-lines" aria-live="polite" aria-atomic="false">
        {step === 0 && <div className="rsa-board-empty"><span>Two secret primes. One key pair.</span><p>Press play or take it one line at a time.</p><span className="rsa-sketch-arrow">↓</span></div>}
        {step >= 1 && <div className="rsa-line" key="multiply"><span className="rsa-line-number">01</span><div><small>MULTIPLY THE PRIMES</small><div className="rsa-equation">n = <em><RSAValue kind="p">{values.p}</RSAValue></em> × <em><RSAValue kind="q">{values.q}</RSAValue></em>{step >= 2 && <strong className="rsa-answer" key={n}> = <RSAValue kind="n">{n}</RSAValue></strong>}</div></div><span className="rsa-margin-note">our shared modulus</span></div>}
        {step >= 3 && <div className="rsa-line" key="totient"><span className="rsa-line-number">02</span><div><small>CALCULATE THE TOTIENT</small><div className="rsa-equation">φ(n) = (<RSAValue kind="p">{values.p}</RSAValue> − 1) × (<RSAValue kind="q">{values.q}</RSAValue> − 1)<strong> = <RSAValue kind="phi">{phi}</RSAValue></strong></div></div><span className="rsa-margin-note">phi of n</span></div>}
        {step >= 4 && <div className="rsa-line" key="public"><span className="rsa-line-number">03</span><div><small>CHOOSE THE PUBLIC EXPONENT</small><div className="rsa-equation">e = <strong><RSAValue kind="e">{e}</RSAValue></strong><span className="rsa-equation-detail">gcd(<RSAValue kind="e">{e}</RSAValue>, <RSAValue kind="phi">{phi}</RSAValue>) = 1</span></div></div><span className="rsa-margin-note">no common factor except 1</span></div>}
        {step >= 5 && <div className="rsa-line" key="private"><span className="rsa-line-number">04</span><div><small>FIND THE PRIVATE EXPONENT</small><div className="rsa-equation">d = <RSAValue kind="e">{e}</RSAValue><sup>−1</sup> mod <RSAValue kind="phi">{phi}</RSAValue><strong> = <RSAValue kind="d">{d}</RSAValue></strong></div><p className="rsa-check"><Check size={13}/> <RSAValue kind="e">{e}</RSAValue> × <RSAValue kind="d">{d}</RSAValue> = {e * d} = {Math.floor(e * d / phi)} × <RSAValue kind="phi">{phi}</RSAValue> + 1</p></div><span className="rsa-margin-note">remainder = 1 ✓</span></div>}
      </div>

      {step === 6 && <div className="rsa-key-result">
        <div className="rsa-key-branches" aria-hidden="true"><span>↙</span><small>n = <RSAValue kind="n">{n}</RSAValue> in both keys</small><span>↘</span></div>
        <div className="rsa-keys">
          <article className="rsa-key public"><div><Key size={21}/><span>PUBLIC KEY<small>Share this</small></span></div><strong>(e, n) = (<RSAValue kind="e">{e}</RSAValue>, <RSAValue kind="n">{n}</RSAValue>)</strong><p>Used to encrypt a message.</p></article>
          <article className="rsa-key private"><div><LockKey size={21}/><span>PRIVATE KEY<small>Keep this secret</small></span></div><strong>(d, n) = (<RSAValue kind="d">{d}</RSAValue>, <RSAValue kind="n">{n}</RSAValue>)</strong><p>Used to decrypt the message.</p></article>
        </div>
        <button className="rsa-break-link" onClick={onBreak}>Now break this key <CaretRight size={16}/></button>
      </div>}
      <div className="rsa-caption" role="status"><span>{String(step + 1).padStart(2, "0")} / 07</span><p>{error ? "Enter valid primes above to start the animation." : captions[step]}</p></div>
    </div>

    <div className="rsa-controls">
      <div className="rsa-playback"><button className="rsa-play" disabled={!!error} onClick={() => { if (step === 6) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} weight="fill"/> : <Play size={15} weight="fill"/>}{playing ? "Pause" : step === 6 ? "Replay" : "Play animation"}</button><button className="rsa-reset" onClick={reset} aria-label="Reset RSA animation"><ArrowCounterClockwise size={17}/></button><label className="rsa-speed">Speed<select value={speed} onChange={event => setSpeed(event.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>
      <div className="rsa-step-actions"><button disabled={step === 0 || !!error} onClick={() => move(step - 1)} aria-label="Previous calculation"><CaretLeft size={15}/></button><span>Line by line</span><button disabled={step === 6 || !!error} onClick={() => move(step + 1)} aria-label="Next calculation"><CaretRight size={15}/></button></div>
    </div>
    <p className="rsa-footnote">Small primes for learning · φ(n) is Euler’s totient · Key notation: exponent, modulus</p>
  </div>;
}
