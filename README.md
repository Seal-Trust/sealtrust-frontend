# TruthMarket

Decentralized marketplace for AI training datasets with cryptographic authenticity verification.

## Overview

TruthMarket is a hackathon project built for Sui x Walrus x Seal x Nautilus that enables secure storage, verification, and distribution of AI training datasets. The platform ensures data authenticity through TEE-based hash verification and provides immutable storage through Walrus.

## Features

- **Dataset Upload**: Store large datasets on Walrus immutable blob storage
- **Hash Verification**: Cryptographic verification of dataset integrity using Nautilus TEE (development mode)
- **On-chain Attestation**: DatasetNFTs minted on Sui blockchain as proof of verification
- **Immutable Storage**: Datasets stored permanently on Walrus decentralized storage

## Tech Stack

- **Frontend**: Next.js 15.5, TypeScript, Tailwind CSS v4
- **Blockchain**: Sui Network, Move smart contracts
- **Storage**: Walrus decentralized blob storage
- **Verification**: Nautilus TEE (AWS Nitro Enclave ready)
- **SDK**: @mysten/sui, @mysten/dapp-kit

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/truthmarket.git
cd truthmarket-frontend-v3

# Install dependencies with pnpm
pnpm install

# Set up environment variables
cp .env.example .env.local
```

## Environment Variables

```bash
# TruthMarket Configuration

# Nautilus TEE Endpoint (local development)
NEXT_PUBLIC_NAUTILUS_URL=http://localhost:3000

# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet

# Move Package IDs (deployed on testnet)
NEXT_PUBLIC_VERIFICATION_PACKAGE=0xcd72d2f54513dcdad0497347ff47e2e0ba94733c78f3a80e19744d5ae8c35fca
NEXT_PUBLIC_ENCLAVE_ID=0x4d26babef2b7d608ba2cad1f8258352da007a9347a28b40bb8c5541af507408c

# Optional: IPFS Gateway
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Run tests
pnpm test
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page with stats
│   ├── register/          # Dataset registration interface
│   └── verify/            # Dataset verification interface
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Header navigation
├── lib/
│   ├── walrus-service.ts  # Walrus storage integration
│   └── utils.ts           # Helper functions
└── styles/
    └── globals.css        # Global styles
```

## Deployed Contracts

### Testnet Deployment

- **Enclave Package**: `0x0ff344b5b6f07b79b56a4ce1e9b1ef5a96ba219f6e6f2c49f194dee29dfc8b7f`
- **Verification Package**: `0xcd72d2f54513dcdad0497347ff47e2e0ba94733c78f3a80e19744d5ae8c35fca`
- **Enclave Config**: `0x4d26babef2b7d608ba2cad1f8258352da007a9347a28b40bb8c5541af507408c`

## How It Works

1. **Upload Dataset**: User uploads a dataset file to Walrus storage
2. **Hash Computation**: SHA-256 hash is computed client-side
3. **TEE Verification**: (In development mode, using `register_dataset_dev`)
4. **NFT Minting**: DatasetNFT created on Sui with verified hash
5. **Query & Verify**: Anyone can verify dataset authenticity by hash

## Development Mode

Currently using `register_dataset_dev` function for hackathon demo:
- Bypasses AWS Nitro Enclave signature verification
- Allows testing without TEE infrastructure
- Production version would use full Nautilus verification

## Security Considerations

- Dataset hashes computed client-side before upload
- Immutable storage ensures data cannot be tampered
- On-chain attestation provides permanent verification record
- TEE verification (production) ensures trustless computation

## Network Configuration

### Sui Testnet
- RPC: https://fullnode.testnet.sui.io:443
- Explorer: https://testnet.suivision.xyz/
- Faucet: https://faucet.testnet.sui.io/

### Walrus Testnet
- Publisher: https://publisher.walrus-testnet.walrus.space
- Aggregator: https://aggregator.walrus-testnet.walrus.space
- Upload Relay: https://upload-relay.testnet.walrus.space

## License

MIT

## Acknowledgments

Built for the Sui x Walrus x Seal x Nautilus Hackathon