import "server-only";
import { timingSafeEqual } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

export const GOOGLE_STATE_COOKIE = "cyberq_google_state";
export const GOOGLE_NONCE_COOKIE = "cyberq_google_nonce";
export const GOOGLE_VERIFIER_COOKIE = "cyberq_google_verifier";
export const GOOGLE_FLOW_SECONDS = 10 * 60;

export function googleConfig(requestUrl) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google SSO is not configured");
  const origin = process.env.APP_URL ? new URL(process.env.APP_URL).origin : new URL(requestUrl).origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri, client: new OAuth2Client(clientId, clientSecret, redirectUri) };
}

export function sameSecret(received, expected) {
  if (typeof received !== "string" || typeof expected !== "string") return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const flowCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth/google",
  maxAge: GOOGLE_FLOW_SECONDS,
};

export function clearGoogleFlow(response) {
  for (const name of [GOOGLE_STATE_COOKIE, GOOGLE_NONCE_COOKIE, GOOGLE_VERIFIER_COOKIE]) {
    response.cookies.set(name, "", { ...flowCookieOptions, maxAge: 0 });
  }
}
