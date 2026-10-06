import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, validateCredentials, createToken, digest, validToken, trustedOrigin } from "../app/lib/auth-utils.mjs";

const signup = { name: "Ada Learner", email: "Ada@Example.com ", password: "a long secret passphrase", confirmPassword: "a long secret passphrase" };

test("signup normalizes identity and preserves password spaces", () => {
  assert.deepEqual(validateCredentials(signup, true), { name: "Ada Learner", email: "ada@example.com", password: signup.password });
  const spaced = { ...signup, password: ` ${signup.password} `, confirmPassword: ` ${signup.password} ` };
  assert.equal(validateCredentials(spaced, true).password, spaced.password);
});

test("rejects invalid input, query injection, oversized passwords and mismatches", () => {
  for (const input of [null, [], { ...signup, email: { $ne: null } }, { ...signup, password: { $ne: null } }, { ...signup, name: "a" }, { ...signup, password: "x".repeat(129) }, { ...signup, password: "short" }, { ...signup, confirmPassword: "different" }]) {
    assert.ok(validateCredentials(input, true).error);
  }
});

test("salted scrypt hashes verify only the original password", async () => {
  const first = await hashPassword(signup.password);
  const second = await hashPassword(signup.password);
  assert.notEqual(first, second);
  assert.equal(await verifyPassword(signup.password, first), true);
  assert.equal(await verifyPassword("incorrect password", first), false);
  for (const hash of [null, "", "scrypt-v1$invalid$invalid", `${first}$extra`]) assert.equal(await verifyPassword(signup.password, hash), false);
});

test("sessions use unpredictable tokens and one-way lookup digests", () => {
  const a = createToken();
  const b = createToken();
  assert.notEqual(a, b);
  assert.ok(validToken(a));
  assert.notEqual(digest(a), a);
  assert.equal(digest(a), digest(a));
  for (const token of [null, {}, "", "forged", "x".repeat(64)]) assert.equal(validToken(token), false);
});

test("auth rejects cross-origin and missing-origin requests", () => {
  const request = (origin, site = "same-origin") => ({ url: "https://cyberq.example/api/auth/login", headers: new Headers({ ...(origin ? { origin } : {}), "sec-fetch-site": site }) });
  assert.equal(trustedOrigin(request("https://cyberq.example")), true);
  assert.equal(trustedOrigin(request("https://attacker.example")), false);
  assert.equal(trustedOrigin(request(null)), false);
  assert.equal(trustedOrigin(request("https://cyberq.example", "cross-site")), false);
});
