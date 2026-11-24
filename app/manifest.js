export default function manifest() {
  return {
    name: "CyberQ Lab — Quantum Cybersecurity Learning",
    short_name: "CyberQ Lab",
    description: "Interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography.",
    start_url: "/",
    display: "standalone",
    background_color: "#12141c",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
