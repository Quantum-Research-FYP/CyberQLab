"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check, Key, LockKey, Pause, Play, ShieldCheck, UsersThree } from "@phosphor-icons/react";

const configs = {
  "Diffie–Hellman": {
    intro: "Two people create the same secret without sending it.",
    values: [
      ["p", "Prime modulus", "23", 1], ["g", "Generator", "5", 2], ["a", "Alice’s secret", "6", 3], ["b", "Bob’s secret", "15", 4],
      ["A", "Alice’s public value", "8", 5], ["B", "Bob’s public value", "19", 6], ["K", "Shared secret", "2", 7],
    ],
    lines: [
      { title: "AGREE ON PUBLIC PARAMETERS", equation: [V("p"), " = 23   ·   ", V("g"), " = 5"], note: "Anyone may know these values." },
      { title: "CHOOSE PRIVATE SECRETS", equation: [V("a"), " = 6   ·   ", V("b"), " = 15"], note: "Alice and Bob keep these numbers private." },
      { title: "CREATE AND EXCHANGE PUBLIC VALUES", equations: [[V("A"), " = ", V("g"), "^", V("a"), " mod ", V("p"), " = 8"], [V("B"), " = ", V("g"), "^", V("b"), " mod ", V("p"), " = 19"]], note: "A and B cross the public network." },
      { title: "DERIVE THE SAME SHARED SECRET", equations: [["Alice: ", V("K"), " = ", V("B"), "^", V("a"), " mod ", V("p"), " = 2"], ["Bob: ", V("K"), " = ", V("A"), "^", V("b"), " mod ", V("p"), " = 2"]], check: "Both sides reached K = 2." },
    ],
    results: [["Alice", "Uses B and private a", "K = 2", "left"], ["Bob", "Uses A and private b", "K = 2", "right"]],
  },
  ECDH: {
    intro: "Two people reach the same point on an elliptic curve.",
    values: [["G", "Base point", "G", 1], ["dA", "Alice’s private scalar", "dA", 3], ["dB", "Bob’s private scalar", "dB", 4], ["QA", "Alice’s public point", "dA·G", 5], ["QB", "Bob’s public point", "dB·G", 6], ["S", "Shared point", "dA·dB·G", 7]],
    lines: [
      { title: "AGREE ON A CURVE AND BASE POINT", equation: ["Curve = P-256   ·   ", V("G"), " = public base point"], note: "The curve and G are public parameters." },
      { title: "CHOOSE PRIVATE SCALARS", equation: [V("dA"), " ← random   ·   ", V("dB"), " ← random"], note: "Each scalar stays on its owner’s device." },
      { title: "PUBLISH THE CURVE POINTS", equations: [[V("QA"), " = ", V("dA"), " · ", V("G")], [V("QB"), " = ", V("dB"), " · ", V("G")]], note: "Reversing Q = d·G means solving the elliptic-curve discrete log." },
      { title: "DERIVE THE SAME SHARED POINT", equations: [["Alice: ", V("S"), " = ", V("dA"), " · ", V("QB")], ["Bob: ", V("S"), " = ", V("dB"), " · ", V("QA")]], check: "Both equations equal dA·dB·G." },
    ],
    results: [["Alice", "dA · QB", "S = dA·dB·G", "left"], ["Bob", "dB · QA", "S = dA·dB·G", "right"]],
  },
  ECDSA: {
    intro: "A private scalar signs; its public point verifies.",
    values: [["d", "Private signing key", "d", 3], ["Q", "Public verification key", "d·G", 5], ["z", "Message digest", "H(m)", 1], ["k", "One-time nonce", "k", 4], ["r", "Signature value r", "r", 6], ["s", "Signature value s", "s", 7]],
    lines: [
      { title: "CREATE THE SIGNING IDENTITY", equation: [V("Q"), " = ", V("d"), " · G"], note: "Publish Q; protect d." },
      { title: "HASH THE MESSAGE", equation: [V("z"), " = H(message)"], note: "The digest binds the signature to this message." },
      { title: "SIGN WITH A FRESH NONCE", equations: [[V("r"), " = x(", V("k"), "·G) mod n"], [V("s"), " = ", V("k"), "⁻¹(", V("z"), " + ", V("r"), "·", V("d"), ") mod n"]], note: "A repeated or exposed k can reveal d." },
      { title: "VERIFY WITH THE PUBLIC KEY", equations: [["u₁ = ", V("z"), "·", V("s"), "⁻¹   ·   u₂ = ", V("r"), "·", V("s"), "⁻¹"], ["X = u₁G + u₂", V("Q")]], check: "Valid when x(X) mod n = r." },
    ],
    results: [["Signer", "Keeps d and k private", "Signature = (r, s)", "left"], ["Verifier", "Uses Q and message", "Signature valid ✓", "right"]],
  },
  DSA: {
    intro: "A finite-field private exponent creates a verifiable signature.",
    values: [["p", "Prime modulus", "23", 1], ["q", "Subgroup order", "11", 2], ["g", "Generator", "2", 5], ["x", "Private key", "3", 3], ["y", "Public key", "8", 6], ["k", "One-time nonce", "7", 4], ["r", "Signature value r", "2", 7], ["s", "Signature value s", "10", 8]],
    lines: [
      { title: "SET THE DOMAIN PARAMETERS", equation: [V("p"), " = 23   ·   ", V("q"), " = 11   ·   ", V("g"), " = 2"], note: "q divides p − 1, and g has order q." },
      { title: "CREATE THE KEY PAIR", equation: [V("y"), " = ", V("g"), "^", V("x"), " mod ", V("p"), " = 8"], note: "x is private; y is public." },
      { title: "SIGN DIGEST z = 9", equations: [[V("r"), " = (", V("g"), "^", V("k"), " mod ", V("p"), ") mod ", V("q"), " = 2"], [V("s"), " = ", V("k"), "⁻¹(9 + ", V("x"), "·", V("r"), ") mod ", V("q"), " = 10"]], note: "The nonce k must be unique and secret." },
      { title: "VERIFY THE SIGNATURE", equations: [["w = ", V("s"), "⁻¹ mod ", V("q"), " = 10"], ["v = ((", V("g"), "² · ", V("y"), "⁹ mod ", V("p"), ") mod ", V("q"), ") = 2"]], check: "v = r, so the signature is valid." },
    ],
    results: [["Signer", "Private x = 3", "Signature = (2, 10)", "left"], ["Verifier", "Public y = 8", "v = r → valid ✓", "right"]],
  },
  "EdDSA / Ed25519": {
    intro: "A private seed produces deterministic Ed25519 signatures.",
    values: [["seed", "Private seed", "32 bytes", 3], ["a", "Private scalar", "a", 4], ["A", "Public key", "a·B", 5], ["r", "Deterministic nonce", "r", 6], ["R", "Nonce point", "r·B", 1], ["S", "Signature scalar", "S", 7]],
    lines: [
      { title: "EXPAND THE PRIVATE SEED", equations: [["h = SHA-512(", V("seed"), ")"], [V("a"), " = clamp(h₀…h₃₁)"]], note: "The other half of h becomes the private prefix." },
      { title: "CREATE THE PUBLIC KEY", equation: [V("A"), " = ", V("a"), " · B"], note: "B is the standard Ed25519 base point." },
      { title: "SIGN DETERMINISTICALLY", equations: [[V("r"), " = H(prefix || message)"], [V("R"), " = ", V("r"), "·B"], [V("S"), " = ", V("r"), " + H(", V("R"), ", ", V("A"), ", m)·", V("a")]], note: "The message and prefix derive the nonce; no random k is needed." },
      { title: "VERIFY THE POINT EQUATION", equation: [V("S"), "·B = ", V("R"), " + H(", V("R"), ", ", V("A"), ", m)·", V("A")], check: "Equal points mean the signature is valid." },
    ],
    results: [["Signer", "Keeps seed and a private", "Signature = (R, S)", "left"], ["Verifier", "Uses public A", "Point equation holds ✓", "right"]],
  },
};

function V(id) { return { id }; }

function Value({ config, id }) {
  const item = config.values.find(value => value[0] === id);
  return <span className={`dl-value dl-tone-${item[3]}`} title={`${id} · ${item[1]}`}><small>{id}</small>{item[2]}</span>;
}

function Equation({ config, parts }) {
  return <div className="rsa-equation dl-equation">{parts.map((part, index) => typeof part === "string" ? <span key={index}>{part}</span> : <Value key={`${part.id}-${index}`} config={config} id={part.id}/>)}</div>;
}

export default function DiscreteLogPlayground({ algorithm }) {
  const config = configs[algorithm];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");

  useEffect(() => { setStep(0); setPlaying(false); }, [algorithm]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= config.lines.length - 1) setPlaying(false);
      setStep(value => Math.min(config.lines.length, value + 1));
    }, 2300 / Number(speed));
    return () => window.clearTimeout(timer);
  }, [playing, step, speed, config.lines.length]);

  const shownLines = useMemo(() => config.lines.slice(0, step), [config, step]);
  const reset = () => { setStep(0); setPlaying(false); };
  const move = next => { setStep(next); setPlaying(false); };

  return <div className="rsa-playground dl-playground">
    <div className="dl-intro"><div><span>WORKED EXAMPLE</span><b>{config.intro}</b></div><div className="dl-stage-dots">{Array.from({ length: config.lines.length + 1 }, (_, index) => <i className={index <= step ? "active" : ""} key={index}/>)}</div></div>
    <div className="rsa-legend dl-legend" aria-label={`${algorithm} value color guide`}><span className="rsa-legend-intro">Follow the colors</span>{config.values.map(([id, label,, tone]) => <span className={`rsa-legend-item dl-tone-${tone}`} key={id} title={label}><b>{id}</b>{label}</span>)}</div>
    <div className="rsa-board dl-board">
      <div className="rsa-board-heading"><span><i/> {algorithm.toUpperCase()} WHITEBOARD</span><span>FOUNDATION / {String(step + 1).padStart(2, "0")}</span></div>
      <div className="rsa-lines dl-lines" aria-live="polite">
        {step === 0 && <div className="rsa-board-empty"><span>{config.intro}</span><p>Press play or take it one line at a time.</p><span className="rsa-sketch-arrow">↓</span></div>}
        {shownLines.map((line, index) => <div className="rsa-line" key={`${algorithm}-${index}`}><span className="rsa-line-number">{String(index + 1).padStart(2, "0")}</span><div><small>{line.title}</small>{(line.equations || [line.equation]).map((equation, equationIndex) => <Equation config={config} parts={equation} key={equationIndex}/>)}{line.check && <p className="rsa-check"><Check size={13}/> {line.check}</p>}</div>{line.note && <span className="rsa-margin-note">{line.note}</span>}</div>)}
      </div>
      {step === config.lines.length && <div className="rsa-key-result dl-result"><div className="rsa-key-branches" aria-hidden="true"><span>↙</span><small>{algorithm.includes("DH") || algorithm.includes("Hellman") ? "same shared result" : "signature crosses the boundary"}</small><span>↘</span></div><div className="rsa-keys">{config.results.map(([title, subtitle, result, side], index) => <article className={`rsa-key ${side === "right" ? "private" : "public"}`} key={title}><div>{index ? <ShieldCheck size={21}/> : algorithm.includes("DH") || algorithm.includes("Hellman") ? <UsersThree size={21}/> : <LockKey size={21}/>}<span>{title.toUpperCase()}<small>{subtitle}</small></span></div><strong>{result}</strong></article>)}</div></div>}
      <div className="rsa-caption" role="status"><span>{String(step + 1).padStart(2, "0")} / 05</span><p>{step === 0 ? "Start with the public setup." : step === config.lines.length ? "The complete flow is ready. Matching colors identify the same value everywhere." : config.lines[step - 1].note || config.lines[step - 1].check}</p></div>
    </div>
    <div className="rsa-controls"><div className="rsa-playback"><button className="rsa-play" onClick={() => { if (step === config.lines.length) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} weight="fill"/> : <Play size={15} weight="fill"/>}{playing ? "Pause" : step === config.lines.length ? "Replay" : "Play animation"}</button><button className="rsa-reset" onClick={reset} aria-label="Reset animation"><ArrowCounterClockwise size={17}/></button><label className="rsa-speed">Speed<select value={speed} onChange={event => setSpeed(event.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div><div className="rsa-step-actions"><button disabled={step === 0} onClick={() => move(step - 1)} aria-label="Previous calculation"><CaretLeft size={15}/></button><span>Line by line</span><button disabled={step === config.lines.length} onClick={() => move(step + 1)} aria-label="Next calculation"><CaretRight size={15}/></button></div></div>
    <p className="rsa-footnote">Small and symbolic values for learning · Matching colors track each element through the flow</p>
  </div>;
}
