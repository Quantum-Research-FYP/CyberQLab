"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";

export default function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function logout() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Couldn’t sign out. Please try again.");
      setPending(false);
    }
  }
  return <div className="logout-control"><button type="button" onClick={logout} disabled={pending} aria-label={pending ? "Signing out…" : "Sign out"} title="Sign out"><SignOut size={16} aria-hidden="true" /><span>{pending ? "Signing out…" : "Sign out"}</span></button>{error && <small role="alert">{error}</small>}</div>;
}
