import { cookies } from "next/headers";
import ThemeProvider from "./components/ThemeProvider";
import "./colors.css";
import "./globals.css";
import "./auth.css";
import "./profile.css";
import "./sidebar.css";

export const metadata = {
  title: "CyberQ Lab — Quantum Cybersecurity Learning",
  description: "CyberQ Lab is an interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }) {
  const savedTheme = (await cookies()).get("cyberq_theme")?.value;
  const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
  return (
    <html lang="en" data-theme={theme || "light"} suppressHydrationWarning>
      <body><ThemeProvider initialTheme={theme}>{children}</ThemeProvider></body>
    </html>
  );
}
