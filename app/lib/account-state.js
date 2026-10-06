import "server-only";
import { getCurrentUser } from "./current-user";
import { getLearning } from "./learning.mjs";
import { databaseErrorDetails } from "./database-errors.mjs";

export async function getAccountState(withLearning = false) {
  try {
    const user = await getCurrentUser();
    return { user, learning: user && withLearning ? await getLearning(user.id) : null, unavailable: false };
  } catch (error) {
    const details = databaseErrorDetails(error);
    if (!details.unavailable) throw error;
    // Connection diagnostics only; never log credentials or the connection string.
    console.warn("Database temporarily unavailable:", details.category, details.code);
    return { user: null, learning: null, unavailable: true };
  }
}
