import "./colors.css";
import "./globals.css";

export const metadata = {
  title: "CyberQ Lab — Quantum Cybersecurity Learning",
  description: "CyberQ Lab is an interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
