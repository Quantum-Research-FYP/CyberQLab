import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeProvider from "./components/ThemeProvider";
import "./colors.css";
import "./globals.css";
import "./auth.css";
import "./profile.css";
import "./sidebar.css";

export const metadata = {
  metadataBase: new URL("https://www.cyberqlab.courses"),
  title: {
    default: "CyberQ Lab — Quantum Cryptography & Cybersecurity Learning",
    template: "%s | CyberQ Lab",
  },
  description:
    "Interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography with algorithm playgrounds, attack simulators, and guided courses.",
  keywords: [
    "quantum cryptography",
    "post-quantum cryptography",
    "quantum key distribution",
    "QKD",
    "BB84 protocol",
    "Shor's algorithm",
    "Grover's algorithm",
    "RSA cryptography",
    "Diffie-Hellman",
    "ECDH",
    "quantum computing",
    "cybersecurity learning",
    "CyberQ Lab",
  ],
  authors: [{ name: "CyberQ Lab", url: "https://www.cyberqlab.courses" }],
  creator: "CyberQ Lab",
  publisher: "CyberQ Lab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.cyberqlab.courses",
    siteName: "CyberQ Lab",
    title: "CyberQ Lab — Quantum Cryptography & Cybersecurity Learning",
    description:
      "Interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography with algorithm playgrounds and guided courses.",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "CyberQ Lab Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CyberQ Lab — Quantum Cryptography & Cybersecurity Learning",
    description:
      "Interactive platform for learning quantum computing, cybersecurity, and post-quantum cryptography with algorithm playgrounds and guided courses.",
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  category: "education",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.cyberqlab.courses/#website",
      "url": "https://www.cyberqlab.courses",
      "name": "CyberQ Lab",
      "description":
        "Interactive platform for learning quantum cryptography, quantum computing, and post-quantum cybersecurity.",
      "publisher": {
        "@type": "Organization",
        "@id": "https://www.cyberqlab.courses/#organization",
        "name": "CyberQ Lab",
        "url": "https://www.cyberqlab.courses",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.cyberqlab.courses/icon.svg",
        },
      },
      "inLanguage": "en-US",
    },
    {
      "@type": "EducationalOrganization",
      "@id": "https://www.cyberqlab.courses/#organization",
      "name": "CyberQ Lab",
      "url": "https://www.cyberqlab.courses",
      "logo": "https://www.cyberqlab.courses/icon.svg",
      "description":
        "Interactive quantum cybersecurity and post-quantum cryptography learning environment.",
    },
    {
      "@type": "Course",
      "@id": "https://www.cyberqlab.courses/#course",
      "name": "Quantum Cryptography Foundations",
      "description":
        "Master QKD, BB84 protocol, implementation security, quantum threats, Shor's algorithm, and post-quantum cryptography through 12 interactive sections and quizzes.",
      "provider": {
        "@type": "Organization",
        "name": "CyberQ Lab",
        "sameAs": "https://www.cyberqlab.courses",
      },
      "educationalLevel": "Beginner to Intermediate",
      "isAccessibleForFree": true,
      "inLanguage": "en-US",
      "hasCourseInstance": {
        "@type": "CourseInstance",
        "courseMode": "Online",
        "courseWorkload": "PT6H",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.cyberqlab.courses/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is CyberQ Lab?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CyberQ Lab is an interactive learning platform for quantum computing, classical cryptography (RSA, Diffie-Hellman, ECC), quantum threats (Shor's and Grover's algorithms), and post-quantum cryptography (NIST FIPS 203 ML-KEM, FIPS 204 ML-DSA, and BB84 QKD)."
          }
        },
        {
          "@type": "Question",
          "name": "How does Shor's algorithm threaten public-key cryptography?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Shor's algorithm uses quantum period finding via the Quantum Fourier Transform to solve integer factorization and discrete logarithms in polynomial time, breaking RSA, Diffie-Hellman, DSA, and Elliptic Curve Cryptography (ECC)."
          }
        },
        {
          "@type": "Question",
          "name": "What is ML-KEM and how does it protect against quantum computers?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "ML-KEM (Module-Lattice-Based Key-Encapsulation Mechanism), standardized in NIST FIPS 203 and derived from CRYSTALS-Kyber, is a lattice-based post-quantum key agreement algorithm based on the Module Learning With Errors (M-LWE) problem."
          }
        },
        {
          "@type": "Question",
          "name": "How does the BB84 protocol detect eavesdropping?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "BB84 transmits quantum states across conjugate bases (computational Z and diagonal X). Due to quantum measurement disturbance, an eavesdropper intercepting and resending states induces an expected 25% Quantum Bit Error Rate (QBER) in the sifted key, exposing their presence."
          }
        },
        {
          "@type": "Question",
          "name": "What is a Harvest-Now-Decrypt-Later (HNDL) attack?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "In a Harvest-Now-Decrypt-Later attack, adversaries intercept and record encrypted communication sessions today to decrypt them in the future once cryptanalytically relevant quantum computers exist. Upgrading to hybrid post-quantum key exchange (e.g., X25519 + ML-KEM-768) prevents future decryption."
          }
        }
      ]
    }
  ],
};

export default async function RootLayout({ children }) {
  const savedTheme = (await cookies()).get("cyberq_theme")?.value;
  const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
  return (
    <html lang="en" data-theme={theme || "light"} suppressHydrationWarning>
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="https://www.cyberqlab.courses/llms.txt"
          title="LLM Content Summary"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
