import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://fullnode.testnet.sui.io https://fullnode.mainnet.sui.io https://*.walrus-testnet.walrus.space https://evm-rpc-testnet.sei-apis.com https://evm-rpc.sei-apis.com https://reliable-pig-585.convex.cloud wss://reliable-pig-585.convex.cloud https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://api.web3modal.org https://*.reown.com wss://*.reown.com https://pulse.walletconnect.org http://localhost:3000",
              "frame-src 'self'",
              "media-src 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  }
};

export default nextConfig;
