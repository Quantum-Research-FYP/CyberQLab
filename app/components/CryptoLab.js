"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileView from "./ProfileView";
import useLearningProgress from "./useLearningProgress";
import RSAPlayground from "./RSAPlayground";
import RSABreakPlayground from "./RSABreakPlayground";
import DiscreteLogPlayground from "./DiscreteLogPlayground";
import DiscreteLogAttackPlayground from "./DiscreteLogAttackPlayground";
import PostQuantumPlayground from "./PostQuantumPlayground";
import QuantumCourse from "./QuantumCourse";
import ProfileDropdown from "./ProfileDropdown";
import { createRSA } from "./rsa.mjs";
import {
  Atom,
  BookOpen,
  CaretDown,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretLeft,
  CaretRight,
  Check,
  CirclesThreePlus,
  ClockCounterClockwise,
  Cube,
  Database,
  Function,
  Hash,
  Key,
  Lightning,
  LockKey,
  Play,
  Pause,
  ArrowCounterClockwise,
  CornersIn,
  CornersOut,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  TrendUp,
  User,
  Warning,
  X,
} from "@phosphor-icons/react";

const algorithms = {
  RSA: {
    family: "Factoring based",
    category: "Public-key encryption · Signature",
    color: "violet",
    assumption: "Factoring a large composite integer is computationally hard.",
    formula: "n = p × q",
    classicalAttack: "General number field sieve",
    steps: [
      { title: "Choose two primes", mini: "Pick private values", body: "Start with two distinct prime numbers. In real systems they are very large and generated at random.", vars: [["p", "61"], ["q", "53"]], icon: CirclesThreePlus },
      { title: "Compute modulus", mini: "Multiply p and q", body: "Multiply the primes. The result is safe to publish, while the original factors remain secret.", vars: [["n", "3,233"], ["φ(n)", "3,120"]], icon: Function },
      { title: "Create key pair", mini: "Public e, private d", body: "Choose a public exponent and calculate its private modular inverse.", vars: [["Public", "(3233, 17)"], ["Private d", "2,753"]], icon: Key },
      { title: "Encrypt or sign", mini: "Apply modular power", body: "Anyone can use the public key. Only the holder of d can decrypt or produce the matching signature.", vars: [["Message m", "65"], ["Cipher c", "2,790"]], icon: LockKey },
    ],
    quantum: ["Create a periodic function", "Prepare superposition", "Apply quantum Fourier transform", "Measure the hidden period", "Recover p and q"],
    examples: [
      { label: "Toy key setup", equation: "p = 61   ·   q = 53", result: "Two secret primes", note: "Real RSA uses primes hundreds of digits long." },
      { label: "Public modulus", equation: "n = 61 × 53 = 3,233", result: "φ(n) = 60 × 52 = 3,120", note: "The public sees n, but p and q stay secret." },
      { label: "Exponent relation", equation: "17 × 2,753 mod 3,120 = 1", result: "e = 17   ·   d = 2,753", note: "d reverses the public exponent operation." },
      { label: "Toy encryption", equation: "65¹⁷ mod 3,233 = 2,790", result: "2,790²⁷⁵³ mod 3,233 = 65", note: "Encryption and decryption are modular powers." },
    ],
    pq: { name: "ML-KEM / ML-DSA", note: "Use ML-KEM for key establishment and ML-DSA for signatures", basis: "Module lattices" },
  },
  "Diffie–Hellman": {
    family: "Discrete log based", category: "Key exchange", color: "blue",
    assumption: "Recovering an exponent from gˣ mod p is computationally hard.", formula: "A = gᵃ mod p",
    classicalAttack: "Index calculus",
    steps: [
      { title: "Agree on parameters", mini: "Public p and g", body: "Alice and Bob publicly choose a large prime modulus and a generator.", vars: [["p", "23"], ["g", "5"]], icon: Database },
      { title: "Choose secrets", mini: "Private a and b", body: "Each person independently chooses a secret random exponent.", vars: [["Alice a", "6"], ["Bob b", "15"]], icon: Key },
      { title: "Exchange values", mini: "Share A and B", body: "They publish values derived from their secrets. An observer sees these values but not the exponents.", vars: [["A", "8"], ["B", "19"]], icon: TrendUp },
      { title: "Derive shared key", mini: "Same secret on both sides", body: "Each side combines the received public value with their private exponent.", vars: [["Shared K", "2"], ["Observer", "?"]], icon: LockKey },
    ], quantum: ["Encode the group operation", "Prepare superposition", "Find two hidden periods", "Solve linear relations", "Recover secret exponent"],
    examples: [
      { label: "Public parameters", equation: "p = 23   ·   g = 5", result: "Everyone may know both", note: "The group and generator are not secrets." },
      { label: "Private choices", equation: "a = 6   ·   b = 15", result: "Never transmitted", note: "Alice and Bob choose independent secrets." },
      { label: "Public exchange", equation: "A = 5⁶ mod 23 = 8", result: "B = 5¹⁵ mod 23 = 19", note: "Reversing these values requires a discrete log." },
      { label: "Same shared secret", equation: "19⁶ mod 23 = 2", result: "8¹⁵ mod 23 = 2", note: "Both sides reach 2 without sending it." },
    ],
    pq: { name: "ML-KEM", note: "Quantum-safe key establishment", basis: "Module lattices" },
  },
  ECDH: {
    family: "Discrete log based", category: "Elliptic-curve key exchange", color: "teal",
    assumption: "Reversing scalar multiplication on an elliptic curve is hard.", formula: "Q = d · G",
    classicalAttack: "Pollard rho on curves",
    steps: [
      { title: "Select a curve", mini: "Public curve and base point", body: "Both sides use the same curve parameters and generator point G.", vars: [["Curve", "P-256"], ["Base", "G"]], icon: Function },
      { title: "Choose scalars", mini: "Private dA and dB", body: "Alice and Bob choose private random numbers called scalars.", vars: [["Alice", "dA"], ["Bob", "dB"]], icon: Key },
      { title: "Publish points", mini: "Multiply G", body: "Each side multiplies G by its private scalar and shares the resulting point.", vars: [["QA", "dA · G"], ["QB", "dB · G"]], icon: TrendUp },
      { title: "Share a point", mini: "dA · QB = dB · QA", body: "Both computations reach the same curve point, which supplies shared key material.", vars: [["Shared", "dA·dB·G"], ["Attacker", "?"]], icon: LockKey },
    ], quantum: ["Represent curve points", "Create quantum registers", "Find hidden subgroup", "Apply quantum Fourier transform", "Recover private scalar"],
    examples: [
      { label: "Shared domain", equation: "E: y² = x³ + ax + b", result: "Base point G", note: "The curve equation and G are public." },
      { label: "Secret scalars", equation: "dA ← random   ·   dB ← random", result: "Private numbers", note: "Good randomness protects both parties." },
      { label: "Public points", equation: "QA = dA·G   ·   QB = dB·G", result: "Points shared openly", note: "Scalar multiplication is easy; reversing it is hard." },
      { label: "Point agreement", equation: "dA·QB = dA·dB·G", result: "dB·QA = dA·dB·G", note: "A key derivation function processes this point." },
    ],
    pq: { name: "ML-KEM", note: "Replace curve key exchange", basis: "Module lattices" },
  },
  ECDSA: {
    family: "Discrete log based", category: "Elliptic-curve digital signature", color: "teal",
    assumption: "Recovering the signing key from a public curve point is hard.", formula: "Q = d · G",
    classicalAttack: "Pollard rho on curves",
    steps: [
      { title: "Create key pair", mini: "Private d, public Q", body: "The signer chooses a private scalar d and publishes the curve point Q = d · G.", vars: [["Private", "d"], ["Public", "Q"]], icon: Key },
      { title: "Hash message", mini: "Compress message to z", body: "The message is hashed so the signature binds to a compact, fixed-length value.", vars: [["Message", "m"], ["Digest", "z = H(m)"]], icon: Hash },
      { title: "Create signature", mini: "Use a fresh nonce k", body: "A unique secret nonce and the private key produce the signature pair. Reusing k can expose d.", vars: [["Nonce", "k"], ["Signature", "(r, s)"]], icon: LockKey },
      { title: "Verify signature", mini: "Check with public Q", body: "The verifier combines the digest, signature, and public key to confirm the curve relation.", vars: [["Input", "m, r, s"], ["Result", "valid ✓"]], icon: ShieldCheck },
    ],
    quantum: ["Represent the curve group", "Prepare two registers", "Evaluate point relations", "Apply quantum Fourier transform", "Recover signing key d"],
    examples: [
      { label: "Signing identity", equation: "Q = d·G", result: "Private d   ·   Public Q", note: "Q identifies the signer without revealing d." },
      { label: "Message digest", equation: "z = H(message)", result: "Fixed-length digest", note: "Changing one message bit changes the digest." },
      { label: "Signature pair", equation: "r = x(k·G) mod n", result: "s = k⁻¹(z + r·d) mod n", note: "The nonce k must be fresh and secret." },
      { label: "Verification test", equation: "u₁G + u₂Q → point X", result: "valid when x(X) mod n = r", note: "Verification uses only public information." },
    ],
    pq: { name: "ML-DSA", note: "Replace elliptic-curve signatures", basis: "Module lattices" },
  },
  DSA: {
    family: "Discrete log based", category: "Finite-field digital signature", color: "blue",
    assumption: "The discrete logarithm problem in a finite field is hard.", formula: "y = gˣ mod p",
    classicalAttack: "Index calculus",
    steps: [
      { title: "Set parameters", mini: "Choose p, q, and g", body: "Domain parameters define the finite group used by every signer and verifier.", vars: [["Prime", "p"], ["Generator", "g"]], icon: Database },
      { title: "Create key pair", mini: "Private x, public y", body: "The signer chooses x and publishes g raised to x modulo p.", vars: [["Private", "x"], ["Public", "y"]], icon: Key },
      { title: "Sign digest", mini: "Combine hash, x, and k", body: "A per-message nonce combines with the message digest and private key to create r and s.", vars: [["Digest", "H(m)"], ["Signature", "(r, s)"]], icon: LockKey },
      { title: "Verify relation", mini: "Recompute with y", body: "The verifier checks a modular relation using public values without learning x.", vars: [["Public", "y"], ["Result", "valid ✓"]], icon: ShieldCheck },
    ],
    quantum: ["Encode modular powers", "Prepare superposition", "Find hidden periods", "Solve modular relations", "Recover private key x"],
    examples: [
      { label: "Domain setup", equation: "q divides (p − 1)", result: "g has order q mod p", note: "All participants may share these parameters." },
      { label: "Signing identity", equation: "y = gˣ mod p", result: "Private x   ·   Public y", note: "Finding x from y is the discrete-log problem." },
      { label: "Signature pair", equation: "r = (gᵏ mod p) mod q", result: "s = k⁻¹(H(m) + x·r) mod q", note: "Reusing nonce k can reveal the private key." },
      { label: "Verification test", equation: "v = ((gᵘ¹·yᵘ² mod p) mod q)", result: "valid when v = r", note: "The verifier reconstructs the public relation." },
    ],
    pq: { name: "ML-DSA", note: "Replace finite-field signatures", basis: "Module lattices" },
  },
  "EdDSA / Ed25519": {
    family: "Discrete log based", category: "Edwards-curve digital signature", color: "teal",
    assumption: "The elliptic-curve discrete logarithm problem on Edwards25519 is hard.", formula: "A = a · B",
    classicalAttack: "Pollard rho on curves",
    steps: [
      { title: "Expand private seed", mini: "Hash and clamp", body: "A random seed is hashed and transformed into a private scalar plus a signing prefix.", vars: [["Seed", "32 bytes"], ["Scalar", "a"]], icon: Hash },
      { title: "Publish point", mini: "Compute A = a · B", body: "Scalar multiplication creates the public verification point A.", vars: [["Base", "B"], ["Public", "A"]], icon: TrendUp },
      { title: "Sign deterministically", mini: "Derive nonce from message", body: "The nonce comes from the private prefix and message, avoiding reliance on fresh randomness.", vars: [["Nonce", "r = H(prefix,m)"], ["Signature", "(R, S)"]], icon: LockKey },
      { title: "Verify equation", mini: "Check points", body: "The verifier checks whether the signature and public point satisfy the required curve equation.", vars: [["Equation", "S·B = R + k·A"], ["Result", "valid ✓"]], icon: ShieldCheck },
    ],
    quantum: ["Represent Edwards points", "Prepare quantum registers", "Evaluate point additions", "Apply quantum Fourier transform", "Recover private scalar a"],
    examples: [
      { label: "Key expansion", equation: "h = SHA-512(seed)", result: "a = clamp(h₀…h₃₁)", note: "The other half of h becomes a private prefix." },
      { label: "Public identity", equation: "A = a·B", result: "Encode point A", note: "B is the standard Ed25519 base point." },
      { label: "Deterministic signature", equation: "r = H(prefix || message)", result: "R = r·B   ·   S = r + H(R,A,m)·a", note: "The message helps derive the nonce." },
      { label: "Verification equation", equation: "S·B = R + H(R,A,m)·A", result: "Equal points → valid", note: "The private scalar never leaves the signer." },
    ],
    pq: { name: "ML-DSA", note: "Replace Edwards-curve signatures", basis: "Module lattices" },
  },
};

const signatureNames = ["ECDSA", "DSA", "EdDSA / Ed25519"];
const overview = [
  { name: "RSA", classical: "Integer factoring", quantum: "Broken by Shor", impact: "critical" },
  { name: "DH / DSA", classical: "Finite-field discrete log", quantum: "Broken by Shor", impact: "critical" },
  { name: "EC family", classical: "Elliptic-curve discrete log", quantum: "Broken by Shor", impact: "critical" },
  { name: "AES-256", classical: "Exhaustive key search", quantum: "Grover: square-root speedup", impact: "partial" },
  { name: "SHA-256", classical: "Preimage resistance", quantum: "Grover: reduced margin", impact: "partial" },
];

function Logo() {
  return <div className="logo"><span className="logo-mark"><Atom size={22} weight="duotone" /></span><span>CyberQ Lab</span></div>;
}

function Sidebar({ active, setActive, open, close, workspace, setWorkspace, courseAnswers, openProfile, collapsed, toggleCollapsed }) {
  const completed = Object.values(courseAnswers).filter((sectionAnswers) => Object.keys(sectionAnswers || {}).length === 5).length;
  const progress = Math.round(completed / 12 * 100);
  return <aside id="main-navigation" aria-label="Main navigation" className={`sidebar ${open ? "open" : ""}`}>
    <div className="sidebar-head"><Logo /><button className="sidebar-toggle icon-btn" onClick={toggleCollapsed} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} title={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} aria-controls="sidebar-links">{collapsed ? <CaretDoubleRight size={15} weight="bold"/> : <CaretDoubleLeft size={15} weight="bold"/>}</button><button className="icon-btn mobile-close" onClick={close} aria-label="Close navigation"><X size={18}/></button></div>
    <nav id="sidebar-links" aria-label="Workspace and algorithms">
      <p className="nav-label">Workspace</p>
      <button aria-label="Learning lab" title="Learning lab" className={`nav-item ${workspace === "lab" ? "active" : ""}`} onClick={() => {setWorkspace("lab");close();}}><SquaresFour size={18} weight={workspace === "lab" ? "fill" : "regular"}/><span className="sidebar-link-label">Learning lab</span></button>
      <button aria-label="Foundations" title="Foundations" className={`nav-item ${workspace === "course" ? "active" : ""}`} onClick={() => {setWorkspace("course");close();}}><BookOpen size={18}/><span className="sidebar-link-label">Foundations</span></button>
      <Link aria-label="My profile" title="My profile" className={`nav-item ${workspace === "profile" ? "active" : ""}`} href="/profile" prefetch={false} onClick={openProfile}><User size={18}/><span className="sidebar-link-label">My profile</span></Link>
      <p className="nav-label algorithm-label">Algorithms</p>
      <div className="family-row"><span>Factoring based</span><CaretDown size={13}/></div>
      <button aria-label="RSA" title="RSA" className={`algo-item ${active === "RSA" ? "selected" : ""}`} onClick={() => {setActive("RSA");close();}}><span className="algo-icon violet"><Key size={15}/></span><span className="sidebar-link-label">RSA</span><span className="risk-dot"/></button>
      <div className="family-row space-top"><span>Discrete log based</span><CaretDown size={13}/></div>
      {["Diffie–Hellman", "ECDH"].map((name) => <button key={name} aria-label={name} title={name} className={`algo-item ${active === name ? "selected" : ""}`} onClick={() => {setActive(name);close();}}><span className={`algo-icon ${name === "ECDH" ? "teal" : "blue"}`}><Function size={15}/></span><span className="sidebar-link-label">{name}</span><span className="risk-dot"/></button>)}
      {signatureNames.map((name) => <button key={name} aria-label={name} title={name} className={`algo-item ${active === name ? "selected" : ""}`} onClick={() => {setActive(name);close();}}><span className={`algo-icon ${name === "DSA" ? "blue" : "teal"}`}><Hash size={15}/></span><span className="sidebar-link-label">{name}</span><span className="risk-dot"/></button>)}
    </nav>
    <div className="sidebar-foot">
      <section className="sidebar-course-card" aria-label="Your course progress">
        <div className="sidebar-course-heading"><span><BookOpen size={14}/> COURSE PROGRESS</span><strong>{progress}%</strong></div>
        <h2>Quantum Cryptography</h2>
        <div className="sidebar-progress-segments" role="progressbar" aria-label="Completed course sections" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={12} aria-valuetext={`${completed} of 12 sections complete`}>{Array.from({length:12},(_,index)=><i key={index} className={index < completed ? "complete" : ""}/>)}</div>
        <p><b>{completed}</b> of 12 sections completed</p>
      </section>

    </div>
  </aside>;
}

function StepFlow({ data, current, setCurrent }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    if (current === data.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setCurrent(value => value + 1), 1900);
    return () => window.clearTimeout(timer);
  }, [playing, current, data.steps.length, setCurrent]);

  useEffect(() => setPlaying(false), [data]);

  const selectStep = (index) => {
    setPlaying(false);
    setCurrent(index);
  };

  const togglePlayback = () => {
    if (current === data.steps.length - 1) setCurrent(0);
    setPlaying(value => !value);
  };

  const step = data.steps[current];
  const example = data.examples[current];

  return <>
    <div className="workflow-player">
      <div className="player-state">
        <span className={`live-indicator ${playing ? "playing" : ""}`}><i/>{playing ? "Flow running" : "Interactive workflow"}</span>
        <div className="player-dots" aria-label={`Step ${current + 1} of ${data.steps.length}`}>
          {data.steps.map((item, index) => <button key={item.title} className={index === current ? "active" : index < current ? "done" : ""} onClick={() => selectStep(index)} aria-label={`Open ${item.title}`}/>) }
        </div>
      </div>
      <div className="player-actions">
        <button className="reset-flow" onClick={() => { setPlaying(false); setCurrent(0); }}><ArrowCounterClockwise size={14}/> Reset</button>
        <button className={`play-flow ${playing ? "pause" : ""}`} onClick={togglePlayback}>{playing ? <Pause size={13} weight="fill"/> : <Play size={13} weight="fill"/>}{playing ? "Pause" : current === data.steps.length - 1 ? "Replay flow" : "Animate flow"}</button>
      </div>
    </div>
    <div className="flow" style={{"--count": data.steps.length}}>
      {data.steps.map((step, index) => {
        const Icon = step.icon;
        return <div className={`flow-wrap ${index === current ? "current" : ""} ${index < current ? "done" : ""}`} key={step.title}>
          <button className="flow-node" onClick={() => selectStep(index)}>
            <span className="step-num">{index < current ? <Check size={12} weight="bold"/> : `0${index + 1}`}</span>
            <span className="node-icon"><Icon size={24} weight="duotone"/></span>
            <b>{step.title}</b><small>{step.mini}</small>
          </button>
          {index < data.steps.length - 1 && <span className={`connector ${playing && index === current ? "flowing" : ""} ${index < current ? "complete" : ""}`}><i/><CaretRight size={14} weight="bold"/></span>}
        </div>;
      })}
    </div>
    <div className="step-panel">
      <div className="step-copy"><span className="eyebrow">STEP {current + 1} OF {data.steps.length}</span><h3>{step.title}</h3><p>{step.body}</p></div>
      <div className={`transform-view ${playing ? "is-running" : ""}`} key={`${data.category}-${current}`}>
        <div className="transform-value"><span>{step.vars[0][0]}</span><strong>{step.vars[0][1]}</strong></div>
        <div className="transform-operation"><i/><b>{step.mini}</b><CaretRight size={13} weight="bold"/></div>
        <div className="transform-value result"><span>{step.vars[1][0]}</span><strong>{step.vars[1][1]}</strong></div>
      </div>
      <div className="step-controls"><button className="control secondary" disabled={!current} onClick={() => {setPlaying(false);setCurrent(v => v - 1);}}><CaretLeft size={16}/> Back</button><button className="control primary" disabled={current === data.steps.length - 1} onClick={() => {setPlaying(false);setCurrent(v => v + 1);}}>Next step <CaretRight size={16}/></button></div>
    </div>
    <div className="worked-example" key={`example-${data.category}-${current}`}>
      <div className="example-label"><span><Function size={15} weight="duotone"/></span><div><small>WORKED EXAMPLE</small><b>{example.label}</b></div></div>
      <div className="example-equation"><small>CALCULATION</small><code>{example.equation}</code></div>
      <div className="example-result"><small>RESULT</small><strong>{example.result}</strong></div>
      <p><Sparkle size={13} weight="fill"/>{example.note}</p>
    </div>
  </>;
}

function AttackVisualizer({ data }) {
  const [attackStep, setAttackStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const advance = () => setAttackStep(v => (v + 1) % data.quantum.length);
  return <section className="attack-section">
    <div className="section-heading"><div><span className="eyebrow coral">QUANTUM ATTACK VISUALIZER</span><h2>Same problem. A different way in.</h2><p>Compare how each computer searches for the secret structure.</p></div><span className="concept-badge"><Sparkle size={15} weight="fill"/> Conceptual simulation</span></div>
    <div className="duel-grid">
      <div className="duel-card classical-card">
        <div className="duel-title"><span className="round-icon grey"><Cube size={19}/></span><div><b>Classical attack</b><small>{data.classicalAttack}</small></div><span className="status costly">EXPENSIVE</span></div>
        <div className="search-space">
          {Array.from({length: 48}).map((_, i) => <i key={i} className={i === 38 ? "found" : i < 16 ? "checked" : ""}>{i === 38 && <Check size={10}/>}</i>)}
        </div>
        <div className="meter-copy"><span>Search possibilities one region at a time</span><b>2<sup>112+</sup> work</b></div>
        <div className="thin-meter"><i style={{width: "34%"}} /></div>
        <p className="card-note"><ClockCounterClockwise size={17}/> Cost grows extremely quickly with key size.</p>
      </div>
      <div className="versus">VS</div>
      <div className="duel-card quantum-card">
        <div className="duel-title"><span className="round-icon purple"><Atom size={19}/></span><div><b>Quantum approach</b><small>Shor’s algorithm</small></div><span className="status threat">STRUCTURAL</span></div>
        <div className="quantum-path">
          {data.quantum.map((step, i) => <button key={step} className={`${i === attackStep ? "active" : ""} ${i < attackStep ? "passed" : ""}`} onClick={() => setAttackStep(i)}><span>{i < attackStep ? <Check size={11}/> : i + 1}</span><small>{step}</small>{i < data.quantum.length - 1 && <em/>}</button>)}
        </div>
        <div className="wave"><svg viewBox="0 0 500 50" preserveAspectRatio="none"><path d="M0 30 C30 30, 30 4, 60 4 S90 45,120 45 S150 12,180 12 S210 40,240 40 S270 20,300 20 S330 35,360 35 S390 25,420 25 S450 30,500 30"/></svg></div>
        <div className="attack-control"><button onClick={() => {setPlaying(!playing); advance();}}><Play size={13} weight="fill"/> {playing ? "Advance simulation" : "Run concept"}</button><span>{attackStep + 1} / {data.quantum.length}</span></div>
      </div>
    </div>
    <div className="explanation-strip"><Warning size={20} weight="duotone"/><p><b>Why this matters</b><span>Shor’s algorithm uses period finding to reveal the hidden algebraic structure. It does not test every key. A sufficiently capable fault-tolerant quantum computer would make this class of public-key security tractable in theory.</span></p></div>
  </section>;
}

function ThreatMap() {
  return <section className="threat-section">
    <div className="section-heading"><div><span className="eyebrow mint">THE BIGGER PICTURE</span><h2>Not every primitive breaks the same way</h2><p>Public-key systems face a structural attack. Symmetric systems lose part of their security margin.</p></div></div>
    <div className="threat-table">
      <div className="table-head"><span>Primitive</span><span>Classical assumption</span><span>Quantum effect</span><span>Response</span></div>
      {overview.map(row => <div className="table-row" key={row.name}><b>{row.name}</b><span>{row.classical}</span><span><i className={row.impact}/>{row.quantum}</span><span className="response-pill">{row.impact === "critical" ? "Migrate to PQC" : "Use larger output/key"}</span></div>)}
    </div>
  </section>;
}

export default function CryptoLab({ user, initialLearning, initialWorkspace, initialAlgorithm }) {
  const router = useRouter();
  const lastActivity = initialLearning.currentActivity;
  const { answers: courseAnswers, answerQuestion, trackActivity, flush, saving, saveError } = useLearningProgress(initialLearning);
  const [active, setActive] = useState(initialAlgorithm || lastActivity?.algorithm || "RSA");
  const [current, setCurrent] = useState(0);
  const [tab, setTab] = useState(initialAlgorithm ? "foundation" : lastActivity?.stage || "foundation");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  useEffect(() => {
    try { setNavCollapsed(window.localStorage.getItem("cyberq-nav-collapsed") === "true"); } catch {}
  }, []);
  const toggleNavigation = () => {
    const next = !navCollapsed;
    setNavCollapsed(next);
    try { window.localStorage.setItem("cyberq-nav-collapsed", String(next)); } catch {}
  };
  const [workflowFocus, setWorkflowFocus] = useState(false);
  const [workspace, setWorkspaceState] = useState(initialWorkspace || lastActivity?.workspace || "lab");
  const [courseItem, setCourseItem] = useState(lastActivity?.workspace === "course" && lastActivity.sectionIndex !== null ? { sectionIndex: lastActivity.sectionIndex, type: lastActivity.resource } : null);
  const setWorkspace = (next) => {
    if (initialWorkspace === "profile" && next !== "profile") { router.push(`/?workspace=${next}`); return; }
    setWorkspaceState(next);
  };
  const openProfile = async (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try { await flush(); router.push("/profile"); router.refresh(); } catch {}
  };
  const [rsaP, setRsaP] = useState("61");
  const [rsaQ, setRsaQ] = useState("53");
  const rsaKey = useMemo(() => createRSA(rsaP, rsaQ), [rsaP, rsaQ]);
  const openBreak = () => { setWorkflowFocus(false); setTab("attack"); };
  const data = algorithms[active];
  const selectAlgorithm = (name) => { if (initialWorkspace === "profile") { router.push(`/?workspace=lab&algorithm=${encodeURIComponent(name)}`); return; } setWorkspace("lab"); setActive(name); setCurrent(0); setTab("foundation"); };
  const stage = useMemo(() => current === data.steps.length - 1 ? "Ready to inspect the attack" : "Explore each step", [current, data]);

  useEffect(() => {
    if (workspace === "profile") return;
    const activity = workspace === "lab" ? { workspace: "lab", algorithm: active, stage: tab } : { workspace: "course", sectionIndex: courseItem?.sectionIndex ?? null, ...(courseItem ? { resource: courseItem.type } : {}) };
    trackActivity(activity);
  }, [workspace, active, tab, courseItem, trackActivity]);

  useEffect(() => { setWorkflowFocus(false); }, [workspace, active, tab]);

  useEffect(() => {
    if (!workflowFocus) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => event.key === "Escape" && setWorkflowFocus(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [workflowFocus]);

  return <div className={`app-shell ${navCollapsed ? "nav-collapsed" : ""}`}>
    <Sidebar active={active} setActive={selectAlgorithm} open={menuOpen} close={() => setMenuOpen(false)} workspace={workspace} setWorkspace={setWorkspace} courseAnswers={courseAnswers} openProfile={openProfile} collapsed={navCollapsed} toggleCollapsed={toggleNavigation}/>
    {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu"/>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu icon-btn" aria-label="Open navigation" aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><SquaresFour size={20}/></button><div className="crumbs"><span>{workspace === "profile" ? "Account" : workspace === "course" ? "Foundations" : "Learning lab"}</span><CaretRight size={13}/><b>{workspace === "profile" ? "My profile" : workspace === "course" ? "Course library" : active}</b></div><div className="header-actions"><ProfileDropdown user={user} onOpenProfile={openProfile}/></div></header>
      <div className="content">
        {saveError && <div className="learning-save-error" role="alert"><span>{saveError}</span><button onClick={() => flush().catch(() => {})} disabled={saving}>{saving ? "Saving…" : "Retry save"}</button></div>}
        {workspace === "profile" ? <ProfileView user={user} learning={initialLearning}/> : workspace === "course" ? <QuantumCourse answers={courseAnswers} onAnswer={answerQuestion} onOpenAlgorithm={selectAlgorithm} activeItem={courseItem} setActiveItem={setCourseItem}/> : <>
        <section className="intro">
          <div><div className="family-tag"><i className={data.color}/>{data.family}</div><h1>{active}</h1><p>{data.category}</p></div>
          <div className="threat-chip"><span><Warning size={18} weight="fill"/></span><div><small>QUANTUM STATUS</small><b>Vulnerable to Shor</b></div></div>
        </section>
        <div className="journey-tabs">
          <button className={tab === "foundation" ? "active" : ""} onClick={() => setTab("foundation")}><span>1</span> Classical foundation</button>
          <i/>
          <button className={tab === "attack" ? "active" : ""} onClick={() => setTab("attack")}><span>2</span> Quantum attack</button>
          <i/>
          <button className={tab === "protect" ? "active" : ""} onClick={() => setTab("protect")}><span>3</span> Post-quantum path</button>
        </div>

        {tab === "foundation" && <>
          {workflowFocus && <button className="focus-backdrop" onClick={() => setWorkflowFocus(false)} aria-label="Exit workflow focus mode"/>}
          <section className={`foundation-card ${workflowFocus ? "workflow-focus" : ""}`}>
            <div className="card-top"><div><span className="eyebrow">CLASSICAL WORKFLOW</span><h2>{active === "RSA" ? "RSA key playground" : `${active} whiteboard`}</h2></div><div className="workflow-head-actions"><span className="manual-badge"><span className="pulse-dot"/> Interactive whiteboard</span><button className="focus-button" onClick={() => setWorkflowFocus(value => !value)}>{workflowFocus ? <CornersIn size={15}/> : <CornersOut size={15}/>} {workflowFocus ? "Exit focus" : "Focus mode"}</button></div></div>
            {active === "RSA" ? <RSAPlayground p={rsaP} q={rsaQ} setP={setRsaP} setQ={setRsaQ} onBreak={openBreak}/> : <DiscreteLogPlayground algorithm={active}/>}
            {workflowFocus && <p className="focus-hint">Click any stage or press play · Esc closes focus mode</p>}
          </section>
          <section className="assumption-card"><div className="assumption-icon"><ShieldCheck size={27} weight="duotone"/></div><div><span className="eyebrow">SECURITY ASSUMPTION</span><h3>{data.assumption}</h3><p>The public result is easy to compute. Reversing it without the secret is the hard problem.</p></div><code>{data.formula}</code></section>
          <div className="continue-card"><div><Atom size={21} weight="duotone"/><span><b>Next: challenge the assumption</b><small>See how a quantum computer finds the hidden structure.</small></span></div><button onClick={() => setTab("attack")}>Open quantum attack <CaretRight size={16}/></button></div>
        </>}

        {tab === "attack" && <>
          {workflowFocus && <button className="focus-backdrop" onClick={() => setWorkflowFocus(false)} aria-label="Exit workflow focus mode"/>}
          <section className={`foundation-card workflow-whiteboard quantum-whiteboard ${workflowFocus ? "workflow-focus" : ""}`}>
            <div className="card-top"><div><span className="eyebrow coral">QUANTUM WORKFLOW</span><h2>{active} attack whiteboard</h2><p className="rsa-break-subtitle">{active === "RSA" ? "From a public key to a recovered secret, one line at a time." : "Trace the hidden structure from public values to a recovered private exponent."}</p></div><div className="workflow-head-actions"><span className="manual-badge"><span className="pulse-dot"/> Interactive whiteboard</span><button className="focus-button" aria-label={workflowFocus ? "Exit focus" : "Focus mode"} onClick={() => setWorkflowFocus(value => !value)}>{workflowFocus ? <CornersIn size={15}/> : <CornersOut size={15}/>} {workflowFocus ? "Exit focus" : "Focus mode"}</button></div></div>
            {active === "RSA" ? <RSABreakPlayground n={rsaKey.n} e={rsaKey.e} firstPrime={rsaKey.p} onEdit={() => setTab("foundation")}/> : <DiscreteLogAttackPlayground algorithm={active}/>}
            {workflowFocus && <p className="focus-hint">Step through each line or press play · Esc closes focus mode</p>}
          </section>
          <ThreatMap/><div className="continue-card"><div><ShieldCheck size={21} weight="duotone"/><span><b>Next: rebuild protection</b><small>Replace the vulnerable hardness assumption.</small></span></div><button onClick={() => setTab("protect")}>View post-quantum path <CaretRight size={16}/></button></div></>
        }

        {tab === "protect" && <>
          {workflowFocus && <button className="focus-backdrop" onClick={() => setWorkflowFocus(false)} aria-label="Exit workflow focus mode"/>}
          <section className={`foundation-card workflow-whiteboard postquantum-whiteboard ${workflowFocus ? "workflow-focus" : ""}`}>
            <div className="card-top"><div><span className="eyebrow mint">POST-QUANTUM WORKFLOW</span><h2>{active} migration whiteboard</h2><p className="rsa-break-subtitle">Move to a quantum-resistant foundation, one decision at a time.</p></div><div className="workflow-head-actions"><span className="manual-badge"><span className="pulse-dot"/> Interactive whiteboard</span><button className="focus-button" aria-label={workflowFocus ? "Exit focus" : "Focus mode"} onClick={() => setWorkflowFocus(value => !value)}>{workflowFocus ? <CornersIn size={15}/> : <CornersOut size={15}/>} {workflowFocus ? "Exit focus" : "Focus mode"}</button></div></div>
            <PostQuantumPlayground algorithm={active}/>
            {workflowFocus && <p className="focus-hint">Step through each line or press play · Esc closes focus mode</p>}
          </section>
          <ThreatMap/>
        </>}
        </>}
        <footer><Logo/><span>Conceptual learning environment · Examples use toy values</span><span>Built for curious minds</span></footer>
      </div>
    </main>
  </div>;
}
