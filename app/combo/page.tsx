import type { Metadata } from "next";
import Combo from "@/components/Combo";

export const metadata: Metadata = {
  title: "All three at once — Two of Us",
  description:
    "One page, three honest diagnostics. Where you both land — relationship, leadership, and being a grown-up.",
  openGraph: {
    type: "website",
    title: "All three at once — Two of Us",
    description:
      "One page, three honest diagnostics. Where you both land — relationship, leadership, and being a grown-up.",
    images: ["og-combo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "All three at once — Two of Us",
    description:
      "One page, three honest diagnostics. Where you both land — relationship, leadership, and being a grown-up.",
    images: ["og-combo.png"],
  },
};

export default function ComboPage() {
  return <Combo />;
}
