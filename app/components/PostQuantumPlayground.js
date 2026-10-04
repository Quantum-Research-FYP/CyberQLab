"use client";

import { useEffect, useState } from "react";
import { ArrowCounterClockwise, ArrowsLeftRight, CaretLeft, CaretRight, Check, ClipboardText, Key, LockKey, Pause, Play, ShieldCheck, Sparkle, Warning } from "@phosphor-icons/react";

const configs = {
  RSA: {
    role: "Encryption, key transport, and signatures",
    exposure: "RSA has two jobs, so its migration needs two replacement tracks.",
    replacements: [["KEY ESTABLISHMENT", "ML-KEM", "FIPS 203", "Module lattices"], ["DIGITAL SIGNATURES", "ML-DSA", "FIPS 204", "Module lattices"]],
    alternative: "SLH-DSA (FIPS 205) is a hash-based signature alternative.",
    hybrid: "Keep the existing RSA-compatible path while adding the new KEM or a dual-signature path where the protocol supports it.",
    inventory: "TLS certificates, key transport, code signing, document signing, PKI, HSMs",
    result: "ML-KEM for shared secrets · ML-DSA for signatures",
  },
  "Diffie–Hellman": {
    role: "Finite-field key exchange",
    exposure: "Recorded DH traffic may be stored now and decrypted after a future quantum break.",
    replacements: [["KEY ESTABLISHMENT", "ML-KEM", "FIPS 203", "Module lattices"]],
    alternative: "ML-KEM encapsulates a shared secret; it is a KEM, so the protocol flow changes from DH.",
    hybrid: "Combine the DH shared secret with an ML-KEM shared secret through the protocol’s reviewed key combiner.",
    inventory: "TLS, VPNs, SSH, messaging protocols, ephemeral key exchange, custom handshakes",
    result: "ML-KEM shared secret feeds the session-key derivation",
  },
  ECDH: {
    role: "Elliptic-curve key exchange",
    exposure: "ECDH public points reveal private scalars to a sufficiently capable quantum computer.",
    replacements: [["KEY ESTABLISHMENT", "ML-KEM", "FIPS 203", "Module lattices"]],
    alternative: "ML-KEM uses encapsulation and decapsulation instead of multiplying curve points.",
    hybrid: "Combine an ECDH secret and an ML-KEM secret using the construction defined by the target protocol.",
    inventory: "TLS, mobile apps, VPNs, SSH, messaging, device provisioning, embedded protocols",
    result: "ML-KEM replaces the vulnerable curve shared-secret operation",
  },
  ECDSA: {
    role: "Elliptic-curve digital signatures",
    exposure: "A recovered ECDSA private scalar allows an attacker to forge trusted signatures.",
    replacements: [["PRIMARY SIGNATURE", "ML-DSA", "FIPS 204", "Module lattices"], ["ALTERNATIVE", "SLH-DSA", "FIPS 205", "Hash based"]],
    alternative: "ML-DSA is the general-purpose path; SLH-DSA offers a different mathematical foundation with larger signatures.",
    hybrid: "Issue and verify both classical and post-quantum signatures when the application can carry a dual-signature format.",
    inventory: "Certificates, software signing, firmware, identities, tokens, audit records, signed APIs",
    result: "ML-DSA or SLH-DSA verifies identity without curve discrete logs",
  },
  DSA: {
    role: "Finite-field digital signatures",
    exposure: "A quantum discrete-log solution exposes the DSA private signing exponent.",
    replacements: [["PRIMARY SIGNATURE", "ML-DSA", "FIPS 204", "Module lattices"], ["ALTERNATIVE", "SLH-DSA", "FIPS 205", "Hash based"]],
    alternative: "The replacement changes key, signature, and certificate formats; plan for larger artifacts.",
    hybrid: "Use a reviewed dual-signature container during compatibility testing if the surrounding protocol supports one.",
    inventory: "Legacy certificates, signing services, archived signatures, HSMs, trust stores, verification libraries",
    result: "A standardized post-quantum signature replaces finite-field DSA",
  },
  "EdDSA / Ed25519": {
    role: "Edwards-curve digital signatures",
    exposure: "Ed25519’s public point becomes reversible under a large-scale quantum discrete-log attack.",
    replacements: [["PRIMARY SIGNATURE", "ML-DSA", "FIPS 204", "Module lattices"], ["ALTERNATIVE", "SLH-DSA", "FIPS 205", "Hash based"]],
    alternative: "Ed25519 and ML-DSA have different key and signature encodings, so integrations need explicit format support.",
    hybrid: "Carry Ed25519 and a post-quantum signature together only through a specified and reviewed dual-signature design.",
    inventory: "SSH identities, package signing, application tokens, APIs, devices, update systems, trust stores",
    result: "ML-DSA or SLH-DSA protects signatures from quantum discrete logs",
  },
};

const captions = [
  "Begin by locating every place the vulnerable primitive is used.",
  "Identify the exact cryptographic job before choosing a replacement.",
  "Map that job to a standardized post-quantum algorithm.",
  "Test sizes, performance, formats, libraries, and hardware support.",
  "Use a reviewed transition construction where compatibility requires both paths.",
  "Rotate credentials and remove the vulnerable path when the ecosystem is ready.",
];

function ReplacementCard({ item }) {
  return <article className="pq-replacement-card"><small>{item[0]}</small><strong>{item[1]}</strong><span>{item[2]}</span><em>{item[3]}</em></article>;
}

export default function PostQuantumPlayground({ algorithm }) {
  const config = configs[algorithm];
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState("1");
  const total = 5;

  useEffect(() => { setStep(0); setPlaying(false); }, [algorithm]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= total - 1) setPlaying(false);
      setStep(value => Math.min(total, value + 1));
    }, 2400 / Number(speed));
    return () => window.clearTimeout(timer);
  }, [playing, step, speed]);

  const reset = () => { setStep(0); setPlaying(false); };
  const move = next => { setStep(next); setPlaying(false); };

  return <section className="protect-view pq-view">
    <div className="section-heading pq-heading"><div><span className="eyebrow mint">POST-QUANTUM MIGRATION WHITEBOARD</span><h2>Move {algorithm} to a quantum-resistant foundation</h2><p>{config.role}. Follow the migration one decision at a time.</p></div><span className="concept-badge pq-standard-badge"><ShieldCheck size={15} weight="fill"/> NIST standardized</span></div>

    <div className="pq-route" aria-label="Migration route">
      <article className={step >= 0 ? "active old" : "old"}><span><Warning size={19}/></span><small>CURRENT</small><b>{algorithm}</b><em>Quantum vulnerable</em></article>
      <div className={step >= 3 ? "active" : ""}><span>+</span><small>transition</small></div>
      <article className={step >= 3 ? "active hybrid" : "hybrid"}><span><ArrowsLeftRight size={19}/></span><small>BRIDGE</small><b>Hybrid / dual</b><em>Protocol dependent</em></article>
      <div className={step >= 5 ? "active" : ""}><span>→</span><small>cut over</small></div>
      <article className={step >= 5 ? "active safe" : "safe"}><span><ShieldCheck size={19}/></span><small>TARGET</small><b>{config.replacements.map(item => item[1]).join(" / ")}</b><em>Post-quantum</em></article>
    </div>

    <div className="rsa-playground pq-playground">
      <div className="pq-legend"><span><i className="current"/> Classical</span><span><i className="bridge"/> Transition</span><span><i className="target"/> Post-quantum</span><span className="pq-progress">{String(step + 1).padStart(2, "0")} / 06</span></div>
      <div className="rsa-board pq-board">
        <div className="rsa-board-heading"><span><i/> MIGRATION WHITEBOARD</span><span>{algorithm.toUpperCase()} → PQC</span></div>
        <div className="rsa-lines pq-lines" aria-live="polite">
          {step === 0 && <div className="rsa-board-empty"><span>Where does {algorithm} live?</span><p>Inventory first. Replacement begins after the cryptographic job is understood.</p><span className="rsa-sketch-arrow">↓</span></div>}
          {step >= 1 && <div className="rsa-line"><span className="rsa-line-number">01</span><div><small>DISCOVER AND PRIORITIZE</small><div className="pq-inventory"><ClipboardText size={19}/><span>{config.inventory}</span></div><p className="rsa-break-note">Prioritize long-lived secrets, exposed public traffic, critical signatures, and difficult-to-update systems.</p></div><span className="rsa-margin-note">build a crypto inventory</span></div>}
          {step >= 2 && <div className="rsa-line"><span className="rsa-line-number">02</span><div><small>IDENTIFY THE CRYPTOGRAPHIC JOB</small><div className="pq-job"><span className="pq-chip classical"><Key size={15}/>{algorithm}</span><span>performs</span><strong>{config.role}</strong></div><p className="rsa-break-note">{config.exposure}</p></div></div>}
          {step >= 3 && <div className="rsa-line"><span className="rsa-line-number">03</span><div><small>SELECT A STANDARDIZED REPLACEMENT</small><div className="pq-replacements">{config.replacements.map(item => <ReplacementCard item={item} key={item[1]}/>)}</div><p className="rsa-break-note">{config.alternative}</p></div><span className="rsa-margin-note">match replacement to the job</span></div>}
          {step >= 4 && <div className="rsa-line"><span className="rsa-line-number">04</span><div><small>TEST THE REAL INTEGRATION</small><div className="pq-test-grid"><span><Check size={12}/> Key and signature sizes</span><span><Check size={12}/> Latency and memory</span><span><Check size={12}/> Protocol and certificate formats</span><span><Check size={12}/> Libraries, HSMs, and devices</span></div><p className="rsa-break-note">Use production-like traffic and failure cases; algorithm support alone does not prove protocol interoperability.</p></div></div>}
          {step >= 5 && <div className="rsa-line"><span className="rsa-line-number">05</span><div><small>TRANSITION, ROTATE, THEN RETIRE</small><div className="pq-hybrid-equation"><span className="pq-chip classical">{algorithm}</span><span>+</span><span className="pq-chip postquantum">{config.replacements.map(item => item[1]).join(" / ")}</span><span>→</span><strong>reviewed combined result</strong></div><p className="rsa-break-note">{config.hybrid}</p><p className="rsa-check"><Check size={13}/> Issue new credentials · update trust stores · monitor failures · remove the classical-only route</p></div></div>}
        </div>

        {step === total && <div className="pq-ready-result"><div><LockKey size={22}/><span>BEFORE<small>{algorithm} · vulnerable foundation</small></span></div><span>→</span><div><Sparkle size={22}/><span>MIGRATED RESULT<small>{config.result}</small></span></div><span className="pq-ready"><Check size={14}/> CRYPTO AGILE</span></div>}
        <div className="rsa-caption pq-caption" role="status"><span>{String(step + 1).padStart(2, "0")} / 06</span><p>{captions[step]}</p></div>
      </div>
      <div className="rsa-controls"><div className="rsa-playback"><button className="rsa-play pq-play" onClick={() => { if (step === total) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} weight="fill"/> : <Play size={15} weight="fill"/>}{playing ? "Pause" : step === total ? "Replay migration" : "Play migration"}</button><button className="rsa-reset" onClick={reset} aria-label="Reset migration"><ArrowCounterClockwise size={17}/></button><label className="rsa-speed">Speed<select value={speed} onChange={event => setSpeed(event.target.value)}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div><div className="rsa-step-actions"><button disabled={step === 0} onClick={() => move(step - 1)} aria-label="Previous migration step"><CaretLeft size={15}/></button><span>Line by line</span><button disabled={step === total} onClick={() => move(step + 1)} aria-label="Next migration step"><CaretRight size={15}/></button></div></div>
      <p className="rsa-footnote">Migration guidance is application specific · Hybrid constructions and dual signatures require protocol review</p>
    </div>

    <div className="pq-standard-links"><span>STANDARDIZED BUILDING BLOCKS</span><a href="https://csrc.nist.gov/pubs/fips/203/final" target="_blank" rel="noreferrer"><b>FIPS 203</b> ML-KEM</a><a href="https://csrc.nist.gov/pubs/fips/204/final" target="_blank" rel="noreferrer"><b>FIPS 204</b> ML-DSA</a><a href="https://csrc.nist.gov/pubs/fips/205/final" target="_blank" rel="noreferrer"><b>FIPS 205</b> SLH-DSA</a></div>
  </section>;
}
