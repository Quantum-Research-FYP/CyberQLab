import { readBody } from "../../../lib/request-body.mjs";
import { NextResponse } from "next/server";
import { getDatabase } from "../../../lib/mongodb.mjs";
import { allowAuthAttempt, createSession, deleteSession } from "../../../lib/auth.mjs";
import { hashPassword, verifyPassword, validateCredentials, trustedOrigin, SESSION_COOKIE, SESSION_SECONDS } from "../../../lib/auth-utils.mjs";

export const runtime = "nodejs";
const DUMMY_HASH = `scrypt-v1$${"0".repeat(32)}$${"0".repeat(128)}`;
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });


export async function POST(request, { params }) {
  if (!trustedOrigin(request)) return json({ error: "This request could not be verified. Reload the page and try again." }, 403);
  const { action } = await params;
  if (!["login", "signup", "logout"].includes(action)) return json({ error: "Not found." }, 404);
  const previousToken = request.cookies.get(SESSION_COOKIE)?.value;
  try {
    if (action === "logout") {
      await deleteSession(previousToken);
      const response = json({ ok: true });
      response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
      return response;
    }
    let body;
    try { body = await readBody(request); } catch { return json({ error: "Enter valid account details and try again." }, 400); }
    const fields = validateCredentials(body, action === "signup");
    if (fields.error) return json({ error: fields.error, field: fields.field }, 400);
    if (!await allowAuthAttempt(fields.email)) {
      const response = json({ error: "Too many attempts. Please try again in 15 minutes." }, 429);
      response.headers.set("Retry-After", "900");
      return response;
    }
    const db = await getDatabase();
    let user;
    if (action === "signup") {
      const passwordHash = await hashPassword(fields.password);
      try {
        const result = await db.collection("users").insertOne({ name: fields.name, email: fields.email, passwordHash, createdAt: new Date() });
        user = { _id: result.insertedId };
      } catch (error) {
        if (error.code === 11000) return json({ error: "Unable to create an account with these details. Try signing in instead." }, 409);
        throw error;
      }
    } else {
      user = await db.collection("users").findOne({ email: fields.email });
      const matches = await verifyPassword(fields.password, user?.passwordHash || DUMMY_HASH);
      if (!user || !matches) return json({ error: "The email or password is incorrect." }, 401);
    }
    const session = await createSession(user._id, previousToken);
    const response = json({ ok: true }, action === "signup" ? 201 : 200);
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_SECONDS, expires: session.expiresAt,
    });
    return response;
  } catch (error) {
    // Never log connection strings, submitted credentials, or database error messages.
    console.error("Authentication unavailable:", error.name);
    return json({ error: "We couldn’t connect to your account. Please try again shortly." }, 503);
  }
}
