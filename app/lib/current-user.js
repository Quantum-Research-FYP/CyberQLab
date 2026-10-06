import "server-only";
import { cookies } from "next/headers";
import { getSessionUser } from "./auth.mjs";
import { SESSION_COOKIE } from "./auth-utils.mjs";

export async function getCurrentUser() {
  return getSessionUser((await cookies()).get(SESSION_COOKIE)?.value);
}
