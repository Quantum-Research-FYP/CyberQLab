import { NextResponse } from "next/server";
import { getDatabase } from "../../../../lib/mongodb.mjs";
import { createSession } from "../../../../lib/auth.mjs";
import { SESSION_COOKIE, SESSION_SECONDS } from "../../../../lib/auth-utils.mjs";
import { GOOGLE_NONCE_COOKIE, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, clearGoogleFlow, googleConfig, sameSecret } from "../../../../lib/google-auth.mjs";

export const runtime = "nodejs";

function finish(request, path, session) {
  const response = NextResponse.redirect(new URL(path, request.url));
  clearGoogleFlow(response);
  response.headers.set("Cache-Control", "no-store");
  if (session) response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
    expires: session.expiresAt,
  });
  return response;
}

function profilePhoto(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const nonce = request.cookies.get(GOOGLE_NONCE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;
  if (url.searchParams.has("error")) return finish(request, "/login?oauth_error=cancelled");
  if (!code || !nonce || !codeVerifier || !sameSecret(state, storedState)) return finish(request, "/login?oauth_error=invalid");

  try {
    const { client, clientId, redirectUri } = googleConfig(request.url);
    const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri });
    if (!tokens.id_token) return finish(request, "/login?oauth_error=invalid");
    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: clientId });
    const identity = ticket.getPayload();
    if (!identity?.sub || !identity.email || identity.email_verified !== true || !sameSecret(identity.nonce, nonce)) return finish(request, "/login?oauth_error=invalid");

    const email = identity.email.trim().toLowerCase();
    const name = (identity.name || identity.given_name || email.split("@")[0]).trim().slice(0, 80);
    const avatarUrl = profilePhoto(identity.picture);
    const db = await getDatabase();
    let user = await db.collection("users").findOne({ googleSubject: identity.sub });
    if (!user) {
      user = await db.collection("users").findOne({ email });
      if (user) {
        await db.collection("users").updateOne({ _id: user._id }, { $set: { googleSubject: identity.sub, googleLinkedAt: new Date(), ...(avatarUrl ? { avatarUrl } : {}) } });
      } else {
        const result = await db.collection("users").insertOne({ name, email, googleSubject: identity.sub, ...(avatarUrl ? { avatarUrl } : {}), googleLinkedAt: new Date(), createdAt: new Date() });
        user = { _id: result.insertedId };
      }
    } else if (avatarUrl && avatarUrl !== user.avatarUrl) {
      await db.collection("users").updateOne({ _id: user._id }, { $set: { avatarUrl } });
    }
    const previousToken = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await createSession(user._id, previousToken);
    return finish(request, "/", session);
  } catch (error) {
    console.error("Google sign-in callback failed:", error.name);
    return finish(request, "/login?oauth_error=unavailable");
  }
}
