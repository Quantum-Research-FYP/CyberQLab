import { redirect } from "next/navigation";
import AuthForm from "../components/AuthForm";
import { getAccountState } from "../lib/account-state";
import DatabaseUnavailable from "../components/DatabaseUnavailable";

export const metadata = {
  title: "Sign up",
  description: "Create your free CyberQ Lab account to master quantum cryptography, QKD, BB84, and post-quantum cybersecurity.",
  alternates: {
    canonical: "/signup",
  },
};
export default async function SignupPage() {
  const { user, unavailable } = await getAccountState();
  if (unavailable) return <DatabaseUnavailable />;
  if (user) redirect("/");
  return <AuthForm mode="signup" />;
}
