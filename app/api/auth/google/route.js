import { NextResponse } from "next/server";
import { createToken } from "../../../lib/auth-utils.mjs";
import { GOOGLE_NONCE_COOKIE, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, flowCookieOptions, googleConfig } from "../../../lib/google-auth.mjs";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { client } = googleConfig(request.url);
    const state = createToken();
    const nonce = createToken();
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const authorizationUrl = client.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });
    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set(GOOGLE_STATE_COOKIE, state, flowCookieOptions);
    response.cookies.set(GOOGLE_NONCE_COOKIE, nonce, flowCookieOptions);
    response.cookies.set(GOOGLE_VERIFIER_COOKIE, codeVerifier, flowCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Google sign-in unavailable:", error.name);
    return NextResponse.redirect(new URL("/login?oauth_error=unavailable", request.url));
  }
}
