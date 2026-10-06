import { redirect } from "next/navigation";
import AuthForm from "../components/AuthForm";
import { getAccountState } from "../lib/account-state";
import DatabaseUnavailable from "../components/DatabaseUnavailable";

export const metadata = { title: "Log in — CyberQ Lab" };
export default async function LoginPage() {
  const { user, unavailable } = await getAccountState();
  if (unavailable) return <DatabaseUnavailable />;
  if (user) redirect("/");
  return <AuthForm mode="login" />;
}
