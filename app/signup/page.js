import { redirect } from "next/navigation";
import AuthForm from "../components/AuthForm";
import { getAccountState } from "../lib/account-state";
import DatabaseUnavailable from "../components/DatabaseUnavailable";

export const metadata = { title: "Sign up — CyberQ Lab" };
export default async function SignupPage() {
  const { user, unavailable } = await getAccountState();
  if (unavailable) return <DatabaseUnavailable />;
  if (user) redirect("/");
  return <AuthForm mode="signup" />;
}
