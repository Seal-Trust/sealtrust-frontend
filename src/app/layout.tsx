import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "TruthMarket - AI Dataset Verification Platform",
  description: "Cryptographic verification and timestamping for AI training datasets. Powered by Sui, Walrus, and Nautilus TEE.",
  keywords: "ai, dataset, verification, tee, blockchain, sui, walrus, nautilus, truthmarket, timestamp",
  authors: [{ name: "TruthMarket" }],
  openGraph: {
    title: "TruthMarket - AI Dataset Verification Platform",
    description: "Cryptographic verification and timestamping for AI training datasets",
    type: "website",
    locale: "en_US",
    siteName: "TruthMarket",
  },
  twitter: {
    card: "summary_large_image",
    title: "TruthMarket - AI Dataset Verification Platform",
    description: "Cryptographic verification and timestamping for AI training datasets",
  },
  icons: {
    icon: "/truthmarket.png",
    shortcut: "/truthmarket.png",
    apple: "/truthmarket.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/truthmarket.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
