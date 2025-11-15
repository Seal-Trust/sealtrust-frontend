import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SeiPay - Instant Payments on Sei Network",
  description: "Send and receive instant payments on Sei Network. Fast, secure, and easy to use payment platform.",
  keywords: "sei, payments, blockchain, crypto, web3, seipay",
  authors: [{ name: "SeiPay" }],
  openGraph: {
    title: "SeiPay - Instant Payments on Sei Network",
    description: "Send and receive instant payments on Sei Network",
    type: "website",
    locale: "en_US",
    siteName: "SeiPay",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeiPay - Instant Payments on Sei Network",
    description: "Send and receive instant payments on Sei Network",
  },
  icons: {
    icon: "/seipay.png",
    shortcut: "/seipay.png",
    apple: "/seipay.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/seipay.png",
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
