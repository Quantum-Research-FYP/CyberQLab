export function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

function isPrime(value) {
  if (!Number.isInteger(value) || value < 3 || value > 997) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return false;
  }
  return true;
}

export function createRSA(pInput, qInput) {
  const p = Number(pInput), q = Number(qInput);
  if (!isPrime(p) || !isPrime(q)) return { error: "Enter prime numbers from 3 to 997, such as 61 and 53." };
  if (p === q) return { error: "Choose two different primes for p and q." };
  const n = p * q, phi = (p - 1) * (q - 1);
  let e = 17;
  if (e >= phi || gcd(e, phi) !== 1) {
    e = 3;
    while (gcd(e, phi) !== 1) e += 2;
  }
  const d = modularInverse(e, phi);
  return { p, q, n, phi, e, d };
}

export function modularInverse(e, phi) {
  // Extended Euclidean algorithm: d is the inverse of e modulo phi.
  let [r, nextR, t, nextT] = [phi, e, 0, 1];
  while (nextR) {
    const quotient = Math.floor(r / nextR);
    [r, nextR] = [nextR, r - quotient * nextR];
    [t, nextT] = [nextT, t - quotient * nextT];
  }
  if (r !== 1) throw new Error("The exponent must be coprime to the totient.");
  return ((t % phi) + phi) % phi;
}

export function modPow(base, exponent, modulus) {
  let result = 1n;
  let b = BigInt(base) % BigInt(modulus), power = BigInt(exponent);
  const m = BigInt(modulus);
  while (power > 0n) {
    if (power & 1n) result = result * b % m;
    b = b * b % m;
    power >>= 1n;
  }
  return Number(result);
}

// A bounded, classical order search for the small classroom keys used by the UI.
// Only public values enter this function; factors are recovered from the period.
export function recoverRSA(n, e) {
  if (!Number.isInteger(n) || n < 15 || n > 994009 || !Number.isInteger(e) || e < 2) {
    return { error: "Create a valid toy key in the key playground first." };
  }
  const attempts = [];
  for (let a = 2; a < Math.min(n, 100); a++) {
    const common = gcd(a, n);
    if (common !== 1) {
      attempts.push({ a, reason: `gcd(${a}, ${n}) = ${common} already reveals a factor; choose a coprime base to illustrate period finding.` });
      continue;
    }
    let residue = 1, r = 0;
    do { residue = residue * a % n; r++; } while (residue !== 1 && r < n);
    if (r % 2 !== 0) {
      attempts.push({ a, reason: `The period ${r} is odd. Try another base.` });
      continue;
    }
    const x = modPow(a, r / 2, n);
    const p = gcd(x - 1, n), q = gcd(x + 1, n);
    if (p <= 1 || q <= 1 || p * q !== n) {
      attempts.push({ a, reason: `The half-period gives ${x}; it yields only trivial factors. Try another base.` });
      continue;
    }
    if (!isPrime(p) || !isPrime(q) || p === q) return { error: "Use two distinct primes from 3 to 997 in the key playground." };
    const phi = (p - 1) * (q - 1);
    if (gcd(e, phi) !== 1) return { error: "The public exponent is not coprime to the recovered totient." };
    return { a, r, x, p, q, phi, d: modularInverse(e, phi), attempts };
  }
  return { error: "No useful period found for this toy key. Choose another prime pair." };
}
