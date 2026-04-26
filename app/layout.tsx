import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "How are you two, really?",
  description:
    "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
  openGraph: {
    type: "website",
    title: "How are you two, really?",
    description:
      "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
    images: ["og-cover.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "How are you two, really?",
    description:
      "A trilogy of honest relationship diagnostics. Ten minutes each. Affectionate teasing, not therapy.",
    images: ["og-cover.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`}>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
