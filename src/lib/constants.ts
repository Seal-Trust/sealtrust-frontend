// SealTrust Configuration
export const CONFIG = {
  // Nautilus TEE Endpoint - PRODUCTION AWS Nitro Enclave (via Cloudflare Tunnel)
  NAUTILUS_URL: process.env.NEXT_PUBLIC_NAUTILUS_URL || "https://nautilus.sealtrust.app",

  // Sui Network
  SUI_NETWORK: (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet" | "testnet" | "devnet",

  // Move Package IDs - SealTrust (deployed 2025-11-22)
  VERIFICATION_PACKAGE: process.env.NEXT_PUBLIC_VERIFICATION_PACKAGE || "0xcdc25c90e328f2905c97c01e90424395dd7b10e67769fc8f4ae62b87f1e63e4e",

  // Enclave Object ID - Use this for register_dataset (PRODUCTION)
  // Registered from AWS Nitro attestation on 2025-11-22
  ENCLAVE_ID: process.env.NEXT_PUBLIC_ENCLAVE_ID || "0x611b83f2b4d97471a6c164877ff23a2f0570806baf3d9380d1f11433a2b685ec",

  // EnclaveConfig Object ID - SealTrust (deployed 2025-11-22)
  ENCLAVE_CONFIG_ID: process.env.NEXT_PUBLIC_ENCLAVE_CONFIG_ID || "0x55d6a15a5e8822b39f76dc53031d83beddc1e5b0e3ef804b82e8d4bfe4fbdc32",

  // Enclave Package ID (official Nautilus)
  ENCLAVE_PACKAGE_ID: "0x0ff344b5b6f07b79b56a4ce1e9b1ef5a96ba219f6e6f2c49f194dee29dfc8b7f",
  // Seal Configuration for Encryption
  // SealTrust's allowlist package deployed on testnet (2025-11-22)
  SEAL_PACKAGE_ID: process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID || "0x705937d7b0ffc7c37aa23a445ed52ae521a47adcdffa27fe965e0b73464a9925",
  SEAL_ALLOWLIST_PACKAGE_ID: process.env.NEXT_PUBLIC_SEAL_ALLOWLIST_PACKAGE_ID || "0x705937d7b0ffc7c37aa23a445ed52ae521a47adcdffa27fe965e0b73464a9925",

  // Seal Key Servers - Public testnet providers (verified working)
  SEAL_KEY_SERVERS: process.env.NEXT_PUBLIC_SEAL_KEY_SERVERS?.split(',') || [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // Mysten Labs testnet-1
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // Mysten Labs testnet-2
    '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2', // Ruby Nodes
    '0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007', // NodeInfra
    '0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105', // Overclock
  ],

  // Session key TTL (minutes)
  SESSION_KEY_TTL: 10,


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