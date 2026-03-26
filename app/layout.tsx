import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LexSutra — AI Compliance Diagnostics",
  description:
    "EU AI Act compliance inspections for AI startups in HR tech and Fintech. Get a graded diagnostic report with legal citations, compliance scores, and a prioritised remediation roadmap.",
  keywords:
    "EU AI Act, AI compliance, AI Act diagnostics, high-risk AI, compliance report, EUAIA",
  openGraph: {
    title: "LexSutra — EU AI Act Compliance Diagnostics",
    description:
      "Structured compliance diagnostics for AI startups in HR tech and Fintech. Graded report, legal citations, expert reviewed.",
    url: "https://lexsutra.com",
    siteName: "LexSutra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LexSutra — EU AI Act Compliance Diagnostics",
    description:
      "Structured compliance diagnostics for AI startups. Graded report, legal citations, expert reviewed.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
