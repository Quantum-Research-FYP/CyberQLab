import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const deriveKey = promisify(scrypt);
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
export const SESSION_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_COOKIE = "cyberq_session";

export function validateCredentials(input, signup = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Please enter your account details." };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address.", field: "email" };
  if (!password || password.length > 128) return { error: "Enter a password of up to 128 characters.", field: "password" };
  if (signup && (name.length < 2 || name.length > 80)) return { error: "Enter a name between 2 and 80 characters.", field: "name" };
  if (signup && password.length < 12) return { error: "Use at least 12 characters for your password.", field: "password" };
  if (signup && input.confirmPassword !== password) return { error: "Your passwords do not match.", field: "confirmPassword" };
  return { email, password, name };
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await deriveKey(password, salt, 64, options);
  return `scrypt-v1$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [version, salt, encoded, extra] = typeof stored === "string" ? stored.split("$") : [];
  if (version !== "scrypt-v1" || !/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{128}$/.test(encoded || "") || extra !== undefined) return false;
  const actual = await deriveKey(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(encoded, "hex"));
}

export const digest = (value) => createHash("sha256").update(value).digest("hex");
export const createToken = () => randomBytes(32).toString("hex");
export const validToken = (token) => typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

export function trustedOrigin(request) {
  const origin = request.headers.get("origin");
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(request.url).origin;
  return origin === expected && request.headers.get("sec-fetch-site") !== "cross-site";
}
