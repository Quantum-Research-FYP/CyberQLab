const identities = {
  p: ["p", "First prime"], q: ["q", "Second prime"],
  n: ["n", "Shared modulus"], phi: ["φ", "Totient φ(n)"],
  e: ["e", "Public exponent"], d: ["d", "Private exponent"],
  m: ["m", "Message"], c: ["c", "Ciphertext"],
  a: ["a", "Period-finding base"], r: ["r", "Period"],
  x: ["x", "Half-period result"],
};

export default function RSAValue({ kind, children }) {
  const [symbol, description] = identities[kind];
  return <span className={`rsa-value rsa-color-${kind}`} title={`${symbol} · ${description}`}><span className="rsa-value-symbol">{symbol}</span><span>{children}</span></span>;
}

export function RSALegend({ attack = false }) {
  const kinds = attack ? Object.keys(identities) : ["p", "q", "n", "phi", "e", "d"];
  return <div className="rsa-legend" aria-label="RSA value color guide"><span className="rsa-legend-intro">Follow the colors</span>{kinds.map(kind => <span className={`rsa-legend-item rsa-color-${kind}`} key={kind} title={identities[kind][1]}><b>{identities[kind][0]}</b>{identities[kind][1]}</span>)}</div>;
}
