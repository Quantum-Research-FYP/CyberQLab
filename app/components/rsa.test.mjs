import test from "node:test";
import assert from "node:assert/strict";
import { createRSA, gcd, modPow, modularInverse, recoverRSA } from "./rsa.mjs";

test("recover the classroom private key from public values alone", () => {
  const recovered = recoverRSA(3233, 17);
  assert.equal(recovered.p * recovered.q, 3233);
  assert.equal(recovered.d, 2753);
  assert.equal(modPow(65, 17, 3233), 2790);
  assert.equal(modPow(2790, recovered.d, 3233), 65);
  assert.equal(recovered.a, 3);
  assert.match(recovered.attempts[0].reason, /trivial factors/);
});

test("skip odd periods and expose the retry explanation", () => {
  const recovered = recoverRSA(161, 17);
  assert.match(recovered.attempts[0].reason, /odd/);
  assert.equal(recovered.p * recovered.q, 161);
});

test("recover factors and decrypt across small and large classroom prime pairs", () => {
  const primes = [3, 5, 7, 11, 19, 23, 53, 61, 103, 137, 499, 991, 997];
  for (let i = 0; i < primes.length; i++) {
    for (let j = i + 1; j < primes.length; j++) {
      const key = createRSA(primes[i], primes[j]);
      const result = recoverRSA(key.n, key.e);
      assert.equal(result.error, undefined, `n = ${key.n}`);
      assert.equal(result.p * result.q, key.n);
      assert.equal(result.d, key.d);
      assert.equal(result.r % 2, 0);
      assert.equal(modPow(result.a, result.r, key.n), 1);
      assert.equal(gcd(result.x - 1, key.n), result.p);
      assert.equal(gcd(result.x + 1, key.n), result.q);
      for (const message of [0, 1, primes[i], primes[j], Math.min(65, key.n - 1), key.n - 1]) {
        const cipher = modPow(message, key.e, key.n);
        assert.equal(modPow(cipher, result.d, key.n), message);
      }
    }
  }
});

test("reject invalid classroom inputs", () => {
  for (const pair of [["", 53], [4, 53], [61, 61], [1009, 53], [3.5, 53]]) {
    assert.ok(createRSA(...pair).error);
  }
  for (const pair of [[undefined, undefined], [14, 3], [994010, 17], [15, 2]]) {
    assert.ok(recoverRSA(...pair).error);
  }
  assert.throws(() => modularInverse(2, 8), /coprime/);
});
