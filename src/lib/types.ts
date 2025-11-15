// TruthMarket Type Definitions

// Dataset verification request to Nautilus
export interface DatasetRequest {
  dataset_url: string;
  expected_hash?: string;
  format: string;
  schema_version: string;
}

// Wrapper for Nautilus requests
export interface ProcessDataRequest {
  payload: DatasetRequest;
}

// Dataset verification data (matches Move struct exactly)
export interface DatasetVerification {
  dataset_hash: number[]; // Vec<u8> in Rust/Move
  dataset_url: number[]; // Vec<u8> in Rust/Move
  format: number[]; // Vec<u8> in Rust/Move
  schema_version: number[]; // Vec<u8> in Rust/Move
  verification_timestamp: number; // u64
}

// Intent message wrapper (matches Nautilus common)
export interface IntentMessage<T> {
  intent: number; // 0 for ProcessData
  timestamp_ms: number;
  data: T;
}

// Response from Nautilus TEE (actual format from Rust server)
export interface ProcessedDataResponse {
  response: IntentMessage<DatasetVerification>;
  signature: string; // Hex encoded signature
}

// DatasetNFT on-chain (from Move contract)
export interface DatasetNFT {
  id: string;
  dataset_hash: string; // Hex string
  dataset_url: string;
  format: string;
  schema_version: string;
  verification_timestamp: number;
  enclave_id: string;
  owner?: string;
}

// Registry entry for explorer
export interface RegistryEntry {
  id: string;
  nft: DatasetNFT;
  registrant: string;
  registrant_name?: string;
  tx_digest: string;
  block_number?: number;
  registered_at: number;
}

// Verification result
export interface VerificationResult {
  found: boolean;
  dataset: DatasetNFT | null;
  registrant?: string;
  tx_digest?: string;
  block_number?: number;
}

// Service hook states
export interface ServiceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hash computation result
export interface HashResult {
  hash: string; // Hex string
  size: number; // File size in bytes
  format?: string;
}

// Transaction result
export interface TxResult {
  digest: string;
  effects: {
    status: {
      status: "success" | "failure";
      error?: string;
    };
    created?: Array<{
      owner: string;
      reference: {
        objectId: string;
        version: number;
        digest: string;
      };
    }>;
  };
}

// Nautilus error response
export interface NautilusError {
  error: string;
  code?: string;
  details?: any;
}