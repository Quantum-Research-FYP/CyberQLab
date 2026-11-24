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
  ],
};

export default async function RootLayout({ children }) {
  const savedTheme = (await cookies()).get("cyberq_theme")?.value;
  const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
  return (
    <html lang="en" data-theme={theme || "light"} suppressHydrationWarning>
      <head>
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
