import { redirect } from "next/navigation";
import AuthForm from "../components/AuthForm";
import { getAccountState } from "../lib/account-state";
import DatabaseUnavailable from "../components/DatabaseUnavailable";

export const metadata = { title: "Log in — CyberQ Lab" };
const oauthMessages = {
  cancelled: "Google sign-in was cancelled.",
  invalid: "Google sign-in could not be verified. Please try again.",
  unavailable: "Google sign-in is temporarily unavailable. Please try again shortly.",
};

export default async function LoginPage({ searchParams }) {
  const { user, unavailable } = await getAccountState();
  if (unavailable) return <DatabaseUnavailable />;
  if (user) redirect("/");
  const { oauth_error: oauthError } = await searchParams;
  return <AuthForm mode="login" oauthError={oauthMessages[oauthError] || ""} />;
}
