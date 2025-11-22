# SealTrust Frontend

Next.js web application for SealTrust dataset verification and storage platform.

---

## Overview

This is the user-facing web application for SealTrust. It provides interfaces for:

- Dataset registration with cryptographic verification
- Download and decryption of authorized datasets
- Verification of dataset registrations
- Wallet integration for authentication

---

## Prerequisites

- Node.js 18 or higher
- pnpm package manager
- Sui wallet browser extension
- Running Nautilus server (see `../nautilus-app`)

---

## Quick Start

### Install Dependencies

```bash
pnpm install
```

### Configure Environment

Create `.env.local` file:

```bash
# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet

# Deployed Contracts (update with actual addresses)
NEXT_PUBLIC_VERIFICATION_PACKAGE=0xcd72d2f54513dcdad0497347ff47e2e0ba94733c78f3a80e19744d5ae8c35fca
NEXT_PUBLIC_ENCLAVE_ID=0x4d26babef2b7d608ba2cad1f8258352da007a9347a28b40bb8c5541af507408c
NEXT_PUBLIC_SEAL_PACKAGE_ID=0x...
NEXT_PUBLIC_SEAL_ALLOWLIST_PACKAGE_ID=0x...

# Services
NEXT_PUBLIC_NAUTILUS_URL=http://localhost:3000
```

### Start Development Server

```bash
pnpm dev
```

Application runs on http://localhost:3000

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── register/          # Dataset registration page
│   └── verify/            # Dataset verification page
├── components/            # React components
│   ├── dataset/          # Dataset-specific components
│   ├── layout/           # Layout components
│   └── wallet/           # Wallet integration
├── lib/                  # Core services and utilities
│   ├── seal-service.ts   # Seal encryption service
│   ├── walrus-service.ts # Walrus storage service
│   ├── types.ts          # TypeScript type definitions
│   └── constants.ts      # Configuration constants
└── hooks/                # React hooks
    └── useNautilus.ts    # Nautilus integration hook
```

---

## Key Services

### Seal Service

Handles encryption and decryption using Seal:

```typescript
import { sealService } from '@/lib/seal-service';

// Hash file before encryption
const hash = await sealService.hashFile(file);

// Encrypt dataset
const { encryptedData, policyId } = await sealService.encryptDataset(
  file,
  SEAL_PACKAGE_ID
);

// Decrypt dataset (with session key management)
const decrypted = await sealService.downloadAndDecryptDataset(
  encryptedBlob,
  policyId,
  SEAL_PACKAGE_ID,
  SEAL_ALLOWLIST_PACKAGE_ID,
  userAddress,
  suiClient,
  signPersonalMessage
);

// Verify integrity
const isValid = await sealService.verifyIntegrity(decrypted, originalHash);
```

### Walrus Service

Handles storage operations via HTTP:

```typescript
import { walrusService } from '@/lib/walrus-service';

// Upload encrypted blob
const { blobId, blobUrl } = await walrusService.uploadToWalrus(
  encryptedFile,
  5 // epochs
);

// Download encrypted blob
const encryptedData = await walrusService.downloadFromWalrus(blobId);
```

### Nautilus Integration

Verifies metadata and obtains attestations:

```typescript
const metadata = {
  dataset_id: stringToVecU8(crypto.randomUUID()),
  name: stringToVecU8(fileName),
  description: stringToVecU8(description),
  format: stringToVecU8(fileType),
  size: fileSize,
  original_hash: stringToVecU8(hash),
  walrus_blob_id: stringToVecU8(blobId),
  seal_policy_id: stringToVecU8(policyId),
  timestamp: Date.now(),
  uploader: stringToVecU8(userAddress),
};

const response = await fetch(`${NAUTILUS_URL}/verify_metadata`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ metadata }),
});

const attestation = await response.json();
// attestation.signature contains hex-encoded signature
```

---

## Important Implementation Details

### Hash Before Encryption

Always hash files BEFORE encryption to enable integrity verification:

```typescript
// CORRECT
const hash = await hashFile(file);           // 1. Hash first
const encrypted = await encrypt(file);       // 2. Then encrypt
await upload(encrypted);                     // 3. Upload encrypted

// WRONG - cannot verify integrity later
const encrypted = await encrypt(file);
const hash = await hashFile(encrypted);      // Useless hash
```

### Session Key Management

Session keys minimize wallet popups:

```typescript
// Created once, persisted for 10 minutes in IndexedDB
const sessionKey = await SessionKey.create({
  address: userAddress,
  packageId: SEAL_PACKAGE_ID,
  ttlMin: 10,
  suiClient,
});

// User signs once
const { signature } = await signPersonalMessage({
  message: sessionKey.getPersonalMessage()
});

await sessionKey.setPersonalMessageSignature(signature);

// Persisted for reuse
await set(`sessionKey_${packageId}_${address}`, sessionKey.export());
```

### Type Compatibility

TypeScript types MUST match Rust and Move exactly for BCS serialization:

```typescript
// DatasetVerification matches nautilus-app/src/lib.rs
export interface DatasetVerification {
  dataset_id: number[];      // Vec<u8>
  name: number[];           // Vec<u8>
  description: number[];    // Vec<u8>
  format: number[];         // Vec<u8>
  size: number;             // u64
  original_hash: number[];  // Vec<u8>
  walrus_blob_id: number[]; // Vec<u8>
  seal_policy_id: number[]; // Vec<u8>
  timestamp: number;        // u64
  uploader: number[];       // Vec<u8>
}
```

---

## Development Workflow

### Registration Flow

1. User uploads file in browser
2. Compute hash of original file
3. Encrypt file with Seal
4. Upload encrypted blob to Walrus
5. Send metadata to Nautilus for verification
6. Receive signed attestation
7. Register DatasetNFT on Sui blockchain
8. Display receipt to user

### Download Flow

1. User requests dataset download
2. Check authorization (optional)
3. Download encrypted blob from Walrus
4. Build Seal approval transaction
5. Decrypt using session key
6. Verify hash matches original
7. Provide decrypted file to user

---

## Common Issues

### Nautilus Connection Failed

**Problem**: Cannot connect to http://localhost:3000

**Solution**:
```bash
cd ../nautilus-app
cargo run --release
```

### Session Key Expired

**Problem**: Wallet popup appears repeatedly

**Solution**: Session keys expire after 10 minutes. This is expected behavior. Clear IndexedDB storage if keys become corrupted.

### File Too Large

**Problem**: Upload fails for large files

**Solution**: Walrus has a 10 MB default limit. Implement chunking for larger files or use multiple blobs.

### Type Mismatch Error

**Problem**: BCS serialization fails

**Solution**: Ensure TypeScript types match Rust/Move exactly. Check field order and types in all three languages.

---

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Tests

1. Start Nautilus server
2. Run frontend
3. Connect wallet
4. Test registration flow
5. Test download flow
6. Verify on blockchain explorer

---

## Deployment

### Production Deployment (Vercel Recommended)

**Step 1: Build Locally**

```bash
pnpm build
# Test production build
pnpm start
```

**Step 2: Deploy to Vercel**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Environment Variables for Production:**

```env
# Network
NEXT_PUBLIC_SUI_NETWORK=mainnet

# Deployed Contracts
NEXT_PUBLIC_VERIFICATION_PACKAGE=0x<deployed_package_id>
NEXT_PUBLIC_ENCLAVE_ID=0x<enclave_config_id>
NEXT_PUBLIC_SEAL_PACKAGE_ID=0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d
NEXT_PUBLIC_SEAL_ALLOWLIST_PACKAGE_ID=0x<allowlist_package_id>

# Production Services
NEXT_PUBLIC_NAUTILUS_URL=https://nautilus.yourdomain.com

# Key Servers (your production server + backups)
NEXT_PUBLIC_SEAL_KEY_SERVERS=0xYourKeyServer,0x<verified_provider_1>,0x<verified_provider_2>
```

**Step 3: Configure Custom Domain**

In Vercel dashboard:
1. Go to your project → Settings → Domains
2. Add your domain (e.g., `sealtrust.app`)
3. Update DNS records as instructed

**Step 4: Set Up SSL**

Vercel automatically provisions SSL certificates via Let's Encrypt.

### Alternative: Docker Deployment

**Create `Dockerfile`:**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

**Deploy with Docker:**

```bash
# Build image
docker build -t sealtrust-frontend:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUI_NETWORK=mainnet \
  -e NEXT_PUBLIC_NAUTILUS_URL=https://nautilus.sealtrust.app \
  sealtrust-frontend:latest
```

### Production Checklist

- [ ] Deploy Move contracts to mainnet
- [ ] Deploy Nautilus to AWS Nitro Enclave
- [ ] Deploy Seal key server (or use verified providers)
- [ ] Update all environment variables
- [ ] Test with real transactions
- [ ] Set up monitoring (Vercel Analytics / CloudWatch)
- [ ] Configure custom domain with SSL
- [ ] Test wallet connections
- [ ] Verify Seal encryption/decryption works
- [ ] Check CSP headers allow all services

---

## Performance Optimization

### Session Key Persistence

Session keys are cached in IndexedDB to avoid repeated wallet signatures:

```typescript
// Check for existing valid session key
const stored = await get(`sessionKey_${packageId}_${address}`);
if (stored) {
  const imported = await SessionKey.import(stored, suiClient);
  if (!imported.isExpired()) {
    return imported; // Reuse, no wallet popup
  }
}
```

### Lazy Loading

Large components are lazy loaded:

```typescript
const DatasetDownload = dynamic(() =>
  import('@/components/dataset/DatasetDownload')
);
```

---

## Security Considerations

### Client-Side Encryption

All encryption happens in the browser before data transmission:

```typescript
// Data never leaves device unencrypted
const encrypted = await sealClient.encrypt({
  data: fileBuffer,
  threshold: 2,
  packageId: SEAL_PACKAGE_ID,
});

// Only encrypted data is uploaded
await walrusService.uploadToWalrus(encrypted);
```

### Signature Validation

Nautilus signatures are hex-encoded:

```typescript
// Convert hex signature to bytes
const signatureBytes = hexToVecU8(attestation.signature);

// NOT base64 - this would fail
const wrong = Array.from(atob(attestation.signature), c => c.charCodeAt(0));
```

### Hash Integrity

Original hash is stored on-chain for verification:

```typescript
// Store in DatasetNFT
original_hash: vector<u8>  // Hash of UNENCRYPTED file

// Verify after decryption
const actualHash = await hashFile(decryptedData);
assert(actualHash === originalHash, "Integrity check failed");
```

---

## Network Configuration

### Sui Testnet
- RPC: https://fullnode.testnet.sui.io:443
- Explorer: https://testnet.suivision.xyz/
- Faucet: https://faucet.testnet.sui.io/

### Walrus Testnet
- Publisher: https://publisher.walrus-testnet.walrus.space
- Aggregator: https://aggregator.walrus-testnet.walrus.space

---

## Related Documentation

- Main README: `../README.md`
- Architecture: `../ARCHITECTURE.md`
- Move Contracts: `../move/truthmarket-verification/`
- Nautilus Server: `../nautilus-app/`

---

## Support

For issues and questions:
- Check main README
- Review architecture documentation
- Examine code examples in `/src/lib/`
- Test with Nautilus server running locally

---

## License

Apache License 2.0
