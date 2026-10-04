"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwise, Atom, CaretLeft, CaretRight, Check, ClockCounterClockwise, Cube, Key, LockKey, Pause, Play, ShieldWarning } from "@phosphor-icons/react";

const configs = {
  "Diffie–Hellman": {
    classical: "Index calculus",
    known: [["p", "Prime modulus", "23", 1], ["g", "Generator", "5", 2], ["A", "Alice public", "8", 5], ["B", "Bob public", "19", 6]],
    secret: ["a", "Alice secret", "6", 3],
    relation: ["A", " = ", "g", "^", "a", " mod ", "p"],
    function: "f(u,v) = gᵘ · A⁻ᵛ mod p",
    hidden: "Pairs (u, v) repeat whenever u − a·v has the same value.",
    solve: "Quantum samples reveal linear relations containing a.",
    impact: ["K", "Recovered shared secret", "Bᵃ mod p = 2", 7],
    impactText: "The attacker derives the same session secret as Alice and Bob.",
  },
  ECDH: {
    classical: "Pollard rho on curves",
    known: [["G", "Base point", "G", 1], ["QA", "Alice public point", "dA·G", 5], ["QB", "Bob public point", "dB·G", 6]],
    secret: ["dA", "Alice private scalar", "dA", 3],
    relation: ["QA", " = ", "dA", " · ", "G"],
    function: "f(u,v) = u·G + v·QA",
    hidden: "Different pairs (u, v) collide along a subgroup determined by dA.",
    solve: "Quantum samples reveal equations that determine dA.",
    impact: ["S", "Recovered shared point", "dA·QB", 7],
    impactText: "The attacker recreates the shared point and derives the session key.",
  },
  ECDSA: {
    classical: "Pollard rho on curves",
    known: [["G", "Base point", "G", 1], ["Q", "Public verification key", "d·G", 5]],
    secret: ["d", "Private signing scalar", "d", 3],
    relation: ["Q", " = ", "d", " · ", "G"],
    function: "f(u,v) = u·G + v·Q",
    hidden: "Collisions encode the hidden scalar d in the curve group.",
    solve: "Quantum samples provide linear equations whose solution is d.",
    impact: ["sig", "Forged signature", "Sign any message", 7],
    impactText: "The attacker can impersonate the signer with newly created signatures.",
  },
  DSA: {
    classical: "Index calculus",
    known: [["p", "Prime modulus", "p", 1], ["q", "Subgroup order", "q", 2], ["g", "Generator", "g", 5], ["y", "Public key", "gˣ mod p", 6]],
    secret: ["x", "Private signing key", "x", 3],
    relation: ["y", " = ", "g", "^", "x", " mod ", "p"],
    function: "f(u,v) = gᵘ · y⁻ᵛ mod p",
    hidden: "The repeating structure links u, v, and the private exponent x.",
    solve: "Quantum samples expose linear relations that solve for x.",
    impact: ["sig", "Forged signature", "Create valid (r, s)", 7],
    impactText: "The attacker can sign altered or entirely new messages.",
  },
  "EdDSA / Ed25519": {
    classical: "Pollard rho on curves",
    known: [["B", "Ed25519 base point", "B", 1], ["A", "Public verification key", "a·B", 5]],
    secret: ["a", "Private signing scalar", "a", 3],
    relation: ["A", " = ", "a", " · ", "B"],
    function: "f(u,v) = u·B + v·A",
    hidden: "Point collisions encode the private scalar a.",
    solve: "Quantum samples reveal equations whose solution is a.",
    impact: ["sig", "Forged signature", "Choose r; compute (R, S)", 7],
    impactText: "The seed is not reconstructed, but the recovered scalar is enough to forge signatures.",
  },
};

function Token({ values, id }) {
  const item = values.find(value => value[0] === id);
  return <span className={`dl-value dl-tone-${item?.[3] || 8}`} title={item ? `${id} · ${item[1]}` : id}><small>{id}</small>{item?.[2] || id}</span>;
}

function Relation({ config }) {
  const values = [...config.known, config.secret, config.impact];
  return <div className="rsa-equation dl-equation">{config.relation.map((part, index) => values.some(value => value[0] === part) ? <Token values={values} id={part} key={`${part}-${index}`}/> : <span key={index}>{part}</span>)}</div>;
}

export default function DiscreteLogAttackPlayground({ algorithm }) {
  const config = configs[algorithm];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");
  const total = 6;
  const values = useMemo(() => [...config.known, config.secret, config.impact], [config]);

  useEffect(() => { setStep(0); setPlaying(false); }, [algorithm]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= total - 1) setPlaying(false);
      setStep(value => Math.min(total, value + 1));
    }, 2500 / Number(speed));
    return () => window.clearTimeout(timer);
  }, [playing, step, speed]);

  const reset = () => { setStep(0); setPlaying(false); };
  const move = next => { setStep(next); setPlaying(false); };
  const secret = config.secret;
  const impact = config.impact;

  return <section className="attack-section dl-attack-section">
    <div className="section-heading"><div><span className="eyebrow coral">QUANTUM ATTACK WHITEBOARD</span><h2>Recover the hidden discrete logarithm</h2><p>Follow how Shor’s algorithm turns public group elements into a private exponent.</p></div><span className="concept-badge"><Atom size={15} weight="duotone"/> Conceptual simulation</span></div>

    <div className="dl-attack-compare">
      <article><span className="round-icon grey"><Cube size={19}/></span><div><small>CLASSICAL ROUTE</small><b>{config.classical}</b><p>Work grows rapidly as secure key sizes increase.</p></div><em>SLOW</em></article>
      <span className="dl-vs">VS</span>
      <article className="quantum"><span className="round-icon purple"><Atom size={19}/></span><div><small>QUANTUM ROUTE</small><b>Shor’s discrete-log algorithm</b><p>Find the hidden periodic structure, then solve linear equations.</p></div><em>STRUCTURAL</em></article>
    </div>

    <div className="rsa-playground dl-playground dl-attack-playground">
      <div className="rsa-legend dl-legend" aria-label="Attack value color guide"><span className="rsa-legend-intro">Known publicly</span>{config.known.map(([id, label,, tone]) => <span className={`rsa-legend-item dl-tone-${tone}`} key={id}><b>{id}</b>{label}</span>)}<span className={`rsa-legend-item dl-tone-${secret[3]} dl-secret-legend`}><b>{secret[0]}</b>{step >= 5 ? "Recovered secret" : "Hidden secret"}</span></div>
      <div className="rsa-board dl-board dl-attack-board">
        <div className="rsa-board-heading"><span><i/> ATTACKER’S WHITEBOARD</span><span>DISCRETE LOG / {String(step + 1).padStart(2, "0")}</span></div>
        <div className="dl-attack-known">
          <div><small>PUBLIC INPUT</small><strong>{config.known.map((item, index) => <span key={item[0]}><Token values={values} id={item[0]}/>{index < config.known.length - 1 && <i>·</i>}</span>)}</strong></div>
          <span className="dl-known-arrow">→</span>
          <div className={step >= 5 ? "recovered" : "locked"}><small>{step >= 5 ? "RECOVERED" : "HIDDEN"}</small><strong>{step >= 5 ? <Token values={values} id={secret[0]}/> : <><LockKey size={18}/> {secret[0]} = ?</>}</strong></div>
        </div>

        <div className="rsa-lines dl-lines dl-attack-lines" aria-live="polite">
          {step === 0 && <div className="rsa-board-empty"><span>The forward operation is easy. Can we reverse it?</span><p>{config.function}</p><span className="rsa-sketch-arrow">↓</span></div>}
          {step >= 1 && <div className="rsa-line"><span className="rsa-line-number">01</span><div><small>STATE THE PUBLIC RELATION</small><Relation config={config}/><p className="rsa-break-note">The unknown {secret[0]} is the discrete logarithm.</p></div></div>}
          {step >= 2 && <div className="rsa-line"><span className="rsa-line-number">02</span><div><small>ENCODE A TWO-INPUT GROUP FUNCTION</small><div className="rsa-equation dl-equation"><span>{config.function}</span></div><p className="rsa-break-note">{config.hidden}</p></div><span className="rsa-margin-note">many inputs, repeating outputs</span></div>}
          {step >= 3 && <div className="rsa-line"><span className="rsa-line-number">03</span><div><small>PREPARE SUPERPOSITION</small><div className="dl-registers"><span>|u⟩</span><span>|v⟩</span><i>group operation</i><span>|f(u,v)⟩</span></div><p className="rsa-break-note">Evaluate many pairs coherently so their repeating structure can interfere.</p></div></div>}
          {step >= 4 && <div className="rsa-line"><span className="rsa-line-number">04</span><div><small>APPLY QUANTUM FOURIER TRANSFORMS</small><div className="dl-qft-wave" aria-hidden="true"><span>QFT</span><svg viewBox="0 0 520 50" preserveAspectRatio="none"><path d="M0 25 C28 3 48 47 76 25 S124 3 152 25 S200 47 228 25 S276 3 304 25 S352 47 380 25 S428 3 456 25 S492 43 520 25"/></svg><span>measure</span></div><p className="rsa-break-note">Interference amplifies measurements that satisfy the hidden linear relation.</p></div></div>}
          {step >= 5 && <div className="rsa-line"><span className="rsa-line-number">05</span><div><small>SOLVE THE MEASURED RELATIONS</small><div className="rsa-equation dl-equation"><span>samples → linear equations → </span><Token values={values} id={secret[0]}/></div><p className="rsa-check"><Check size={13}/> {config.solve}</p></div><span className="rsa-margin-note">private value exposed</span></div>}
          {step >= 6 && <div className="rsa-line"><span className="rsa-line-number">06</span><div><small>USE THE RECOVERED SECRET</small><div className="rsa-equation dl-equation"><Token values={values} id={impact[0]}/></div><p className="rsa-check"><ShieldWarning size={14}/> {config.impactText}</p></div></div>}
        </div>

        {step === total && <div className="dl-compromise-result"><div><Key size={21}/><span>PUBLIC INFORMATION<small>Enough input for the quantum attack</small></span></div><span>→</span><div><LockKey size={21}/><span>PRIVATE VALUE RECOVERED<small>{secret[0]} · {secret[1]}</small></span></div><span>→</span><div><ShieldWarning size={21}/><span>SECURITY IMPACT<small>{impact[2]}</small></span></div></div>}
        <div className="rsa-caption" role="status"><span>{String(step + 1).padStart(2, "0")} / 07</span><p>{step === 0 ? "Start only with values an observer can see." : step < 5 ? ["Expose the one-way public relation.", "Encode its hidden repeating structure.", "Prepare quantum registers across many inputs.", "Use interference to reveal useful samples."][step - 1] : step === 5 ? `The private ${secret[0]} is now known.` : config.impactText}</p></div>
      </div>
      <div className="rsa-controls"><div className="rsa-playback"><button className="rsa-play dl-attack-play" onClick={() => { if (step === total) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} weight="fill"/> : <Play size={15} weight="fill"/>}{playing ? "Pause" : step === total ? "Replay attack" : "Play quantum flow"}</button><button className="rsa-reset" onClick={reset} aria-label="Reset quantum attack"><ArrowCounterClockwise size={17}/></button><label className="rsa-speed">Speed<select value={speed} onChange={event => setSpeed(event.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div><div className="rsa-step-actions"><button disabled={step === 0} onClick={() => move(step - 1)} aria-label="Previous attack step"><CaretLeft size={15}/></button><span>Line by line</span><button disabled={step === total} onClick={() => move(step + 1)} aria-label="Next attack step"><CaretRight size={15}/></button></div></div>
      <p className="rsa-footnote"><ClockCounterClockwise size={11}/> Conceptual simulation · Requires a large fault-tolerant quantum computer · No such machine can break production keys today</p>
    </div>
    <div className="explanation-strip"><ShieldWarning size={20} weight="duotone"/><p><b>The security assumption fails</b><span>Classical security relies on reversing the group operation being hard. Shor’s algorithm changes that assumption by solving the discrete logarithm efficiently on a sufficiently capable quantum computer.</span></p></div>
  </section>;
}
