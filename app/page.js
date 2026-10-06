import { redirect } from "next/navigation";
import CryptoLab from "./components/CryptoLab";
import { labAlgorithms } from "./lib/learning-utils.mjs";
import { getAccountState } from "./lib/account-state";
import DatabaseUnavailable from "./components/DatabaseUnavailable";

export default async function Home({ searchParams }) {
  const { user, learning, unavailable } = await getAccountState(true);
  if (unavailable) return <DatabaseUnavailable />;
  if (!user) redirect("/login");
  const { workspace, algorithm } = await searchParams;
  return <CryptoLab user={user} initialLearning={learning} initialAlgorithm={labAlgorithms.includes(algorithm) ? algorithm : undefined} initialWorkspace={["home", "lab", "course"].includes(workspace) ? workspace : undefined} />;
}
