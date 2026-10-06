import "server-only";
import { getDatabase } from "./mongodb.mjs";
import { createToken, digest, SESSION_SECONDS, validToken } from "./auth-utils.mjs";

export async function createSession(userId, previousToken) {
  const db = await getDatabase();
  const token = createToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db.collection("sessions").insertOne({ _id: digest(token), userId, expiresAt, createdAt: new Date() });
  if (validToken(previousToken)) await db.collection("sessions").deleteOne({ _id: digest(previousToken) });
  return { token, expiresAt };
}

export async function getSessionUser(token) {
  if (!validToken(token)) return null;
  const db = await getDatabase();
  const session = await db.collection("sessions").findOne({ _id: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  const user = await db.collection("users").findOne({ _id: session.userId }, { projection: { name: 1, email: 1, createdAt: 1 } });
  return user ? { id: user._id.toString(), name: user.name, email: user.email, createdAt: user.createdAt?.toISOString() || null } : null;
}

export async function deleteSession(token) {
  if (!validToken(token)) return;
  const db = await getDatabase();
  await db.collection("sessions").deleteOne({ _id: digest(token) });
}

// Atomic, shared counters remain effective across server instances and restarts.
export async function allowAuthAttempt(email) {
  const db = await getDatabase();
  const now = Date.now();
  for (const [scope, windowMs, limit] of [["global", 60_000, 200], [`email:${digest(email)}`, 900_000, 10]]) {
    const bucket = Math.floor(now / windowMs);
    const result = await db.collection("auth_attempts").findOneAndUpdate(
      { _id: `${scope}:${bucket}` },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) } },
      { upsert: true, returnDocument: "after" },
    );
    if (result.count > limit) return false;
  }
  return true;
}
