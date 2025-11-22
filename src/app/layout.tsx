import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SealTrust - AI Dataset Verification Platform",
  description: "Cryptographic verification and timestamping for AI training datasets. Powered by Sui, Walrus, Seal, and Nautilus TEE.",
  keywords: "ai, dataset, verification, tee, blockchain, sui, walrus, seal, nautilus, sealtrust, timestamp",
  authors: [{ name: "SealTrust" }],
  openGraph: {
    title: "SealTrust - AI Dataset Verification Platform",
    description: "Cryptographic verification and timestamping for AI training datasets",
    type: "website",
    locale: "en_US",
    siteName: "SealTrust",
  },
  twitter: {
    card: "summary_large_image",
    title: "SealTrust - AI Dataset Verification Platform",
    description: "Cryptographic verification and timestamping for AI training datasets",
  },
  icons: {
    icon: "/sealtrust.svg",
    shortcut: "/sealtrust.svg",
    apple: "/sealtrust.svg",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/sealtrust.svg",
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
