import "server-only";
import { ObjectId } from "mongodb";
import { getDatabase } from "./mongodb.mjs";

export async function getLearning(userId) {
  const db = await getDatabase();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) }, { projection: { learning: 1 } });
  const learning = user?.learning || {};
  return {
    answers: learning.answers || {},
    currentActivity: learning.currentActivity || null,
    lastActiveAt: learning.lastActiveAt?.toISOString() || null,
    history: (learning.history || []).map(entry => ({ ...entry, at: entry.at.toISOString() })),
  };
}

export async function saveLearningEvent(userId, event) {
  const db = await getDatabase();
  const filter = { _id: new ObjectId(userId) };
  const now = new Date();
  if (event.type === "answer") {
    const answerPath = event.courseId ? `learning.answers.${event.courseId}.${event.section}.${event.question}` : `learning.answers.${event.section}.${event.question}`;
    await db.collection("users").updateOne(filter, { $set: { [answerPath]: event.choice, "learning.lastActiveAt": now } });
  } else {
    const user = await db.collection("users").findOne(filter, { projection: { "learning.currentActivity": 1 } });
    const changed = JSON.stringify(user?.learning?.currentActivity) !== JSON.stringify(event.activity);
    await db.collection("users").updateOne(filter, {
      $set: { "learning.currentActivity": event.activity, "learning.lastActiveAt": now },
      ...(changed ? { $push: { "learning.history": { $each: [{ ...event.activity, at: now }], $slice: -8 } } } : {}),
    });
  }
}
