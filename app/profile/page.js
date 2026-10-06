import { redirect } from "next/navigation";
import CryptoLab from "../components/CryptoLab";
import { getAccountState } from "../lib/account-state";
import DatabaseUnavailable from "../components/DatabaseUnavailable";

export const metadata = { title: "Your profile — CyberQ Lab" };
export default async function ProfilePage() {
  const { user, learning, unavailable } = await getAccountState(true);
  if (unavailable) return <DatabaseUnavailable />;
  if (!user) redirect("/login");
  return <CryptoLab user={user} initialLearning={learning} initialWorkspace="profile" />;
}
