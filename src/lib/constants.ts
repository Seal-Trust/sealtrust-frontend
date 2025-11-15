// TruthMarket Configuration
export const CONFIG = {
  // Nautilus TEE Endpoint (replace with actual deployed URL)
  NAUTILUS_URL: process.env.NEXT_PUBLIC_NAUTILUS_URL || "http://localhost:3000",

  // Sui Network
  SUI_NETWORK: (process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet") as "mainnet" | "testnet" | "devnet",

  // Move Package IDs (replace with actual deployed package IDs)
  VERIFICATION_PACKAGE: process.env.NEXT_PUBLIC_VERIFICATION_PACKAGE || "0x...",
  ENCLAVE_ID: process.env.NEXT_PUBLIC_ENCLAVE_ID || "0x...",

  // IPFS/Storage Gateway for fetching datasets (not storing)
  IPFS_GATEWAY: process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/",

  // Walrus Config (though we're only storing hashes on-chain)
  WALRUS_AGGREGATOR: "https://aggregator.walrus-testnet.walrus.space",
  WALRUS_PUBLISHER: "https://publisher.walrus-testnet.walrus.space",
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
} as const;

// Transaction gas budget
export const GAS_BUDGET = 100_000_000; // 0.1 SUI