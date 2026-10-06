import { NextResponse } from "next/server";
import { getCurrentUser } from "../../lib/current-user";
import { getLearning, saveLearningEvent } from "../../lib/learning.mjs";
import { validateLearningEvent } from "../../lib/learning-utils.mjs";
import { trustedOrigin } from "../../lib/auth-utils.mjs";
import { readBody } from "../../lib/request-body.mjs";

export const runtime = "nodejs";
const json = (body, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Please sign in to view your progress." }, 401);
    return json(await getLearning(user.id));
  } catch { return json({ error: "Your progress is temporarily unavailable." }, 503); }
}

export async function PATCH(request) {
  if (!trustedOrigin(request)) return json({ error: "This request could not be verified." }, 403);
  try {
    const user = await getCurrentUser();
    if (!user) return json({ error: "Please sign in to save your progress." }, 401);
    let event;
    try { event = validateLearningEvent(await readBody(request)); } catch { return json({ error: "Invalid learning update." }, 400); }
    if (!event) return json({ error: "Invalid learning update." }, 400);
    await saveLearningEvent(user.id, event);
    return json({ ok: true });
  } catch { return json({ error: "Your progress couldn’t be saved. Please try again." }, 503); }
}
