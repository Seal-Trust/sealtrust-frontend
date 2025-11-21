// TruthMarket Configuration
export const CONFIG = {
  // Nautilus TEE Endpoint (replace with actual deployed URL)
  NAUTILUS_URL: process.env.NEXT_PUBLIC_NAUTILUS_URL || "http://localhost:3000",

  // Sui Network
  SUI_NETWORK: (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet" | "testnet" | "devnet",

  // Move Package IDs (replace with actual deployed package IDs)
  VERIFICATION_PACKAGE: process.env.NEXT_PUBLIC_VERIFICATION_PACKAGE || "0x...",
  ENCLAVE_ID: process.env.NEXT_PUBLIC_ENCLAVE_ID || "0x...",

  // Seal Configuration for Encryption
  // Official Seal allowlist package deployed on testnet (from Seal examples)
  // This includes the seal_approve functions for access control
  SEAL_PACKAGE_ID: process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID || "0xc5ce2742cac46421b62028557f1d7aea8a4c50f651379a79afdf12cd88628807",
  SEAL_ALLOWLIST_PACKAGE_ID: process.env.NEXT_PUBLIC_SEAL_ALLOWLIST_PACKAGE_ID || "0xc5ce2742cac46421b62028557f1d7aea8a4c50f651379a79afdf12cd88628807",

  // Seal Key Servers (as of 2025) - can be overridden via environment variable
  // YOUR KEY SERVER: Local TruthMarket Seal key server (permissioned mode)
  // Public providers: Mysten Labs, Ruby Nodes, NodeInfra, Overclock, H2O Nodes
  SEAL_KEY_SERVERS: process.env.NEXT_PUBLIC_SEAL_KEY_SERVERS?.split(',') || [
    '0xc20c3970bf648a98c4f70740bf385ffbb93c61513f3cdf861488b93df39b93eb', // YOUR TruthMarket key server (localhost:2024)
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // mysten-testnet-1
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // mysten-testnet-2
    '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2', // Ruby Nodes
    '0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007', // NodeInfra
    '0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105', // Overclock
    '0x39cef09b24b667bc6ed54f7159d82352fe2d5dd97ca9a5beaa1d21aa774f25a2', // H2O Nodes
  ],

  // Enable key server verification in production for security
  SEAL_KEY_SERVER_VERIFICATION: process.env.NODE_ENV === 'production' ||
                                 process.env.NEXT_PUBLIC_SEAL_VERIFY_SERVERS === 'true',

  // Session key TTL (minutes)
  SESSION_KEY_TTL: 10,

  // IPFS/Storage Gateway for fetching datasets (not storing)
  IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/",

  // Walrus Config for Encrypted Storage
  WALRUS_AGGREGATOR: "https://aggregator.walrus-testnet.walrus.space",
  WALRUS_PUBLISHER: "https://publisher.walrus-testnet.walrus.space",
  WALRUS_EPOCHS: 5, // Number of epochs to store blobs

  // File Upload Limits
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB - matches API route limit
  MAX_FILE_SIZE_MB: 100,
  URL_FETCH_TIMEOUT: 60000, // 60 seconds for URL downloads
  UPLOAD_TIMEOUT: 120000, // 2 minutes for file uploads

  // Feature flags for gradual rollout
  ENABLE_SEAL_ENCRYPTION: true, // Set to false to rollback to non-encrypted uploads
  ENABLE_SESSION_KEY_PERSISTENCE: true,
  ENABLE_INTEGRITY_VERIFICATION: true,
  ENABLE_URL_DATASETS: true, // Enable fetching datasets from URLs
} as const;

// Dataset formats we support
export const SUPPORTED_FORMATS = [
  "CSV",
  "JSON",
  "PARQUET",
  "AVRO",
  "TSV",
  "XML",
  "HDF5",
  "ZARR",
] as const;

// Schema versions
export const SCHEMA_VERSIONS = [
  "v1.0",
  "v1.1",
  "v2.0",
  "v2.1",
  "v3.0",
] as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet to continue",
  INVALID_URL: "Please provide a valid dataset URL",
  NAUTILUS_UNAVAILABLE: "TEE verification service is currently unavailable",
  TRANSACTION_FAILED: "Transaction failed. Please try again",
  HASH_MISMATCH: "Dataset hash does not match expected value",
  NOT_FOUND: "Dataset not found in registry",
  NETWORK_ERROR: "Network error. Please check your connection",
  FILE_TOO_LARGE: "File exceeds maximum size limit",
  URL_FETCH_FAILED: "Failed to fetch dataset from URL",
  UNSUPPORTED_DOMAIN: "Domain not in allowlist",
  DOWNLOAD_CANCELLED: "Download was cancelled",
  NO_FILE_OR_URL: "Please provide a file or dataset URL",
} as const;

// Transaction gas budget
export const GAS_BUDGET = 100_000_000; // 0.1 SUI