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

// Dataset verification data V3 (matches Move struct EXACTLY - CRITICAL!)
// This MUST match truthmarket.move line 40-51 and nautilus-app/src/lib.rs line 62-73
export interface DatasetVerification {
  dataset_id: number[];          // Vec<u8> - Unique dataset ID
  name: number[];                // Vec<u8> - Dataset name
  description: number[];         // Vec<u8> - Dataset description
  format: number[];              // Vec<u8> - File format
  size: number;                  // u64 - File size in bytes
  original_hash: number[];       // Vec<u8> - Hash of UNENCRYPTED file (CRITICAL!)
  walrus_blob_id: number[];      // Vec<u8> - Walrus storage ID
  seal_policy_id: number[];      // Vec<u8> - Seal access policy ID
  timestamp: number;             // u64 - Verification timestamp
  uploader: number[];            // Vec<u8> - Uploader address
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

// DatasetNFT on-chain V3 (from Move contract)
// This MUST match truthmarket.move line 15-40
export interface DatasetNFT {
  id: string;

  // Core verification data
  original_hash: string;         // Hex string - Hash of UNENCRYPTED file
  metadata_hash: string;         // Hex string - Hash of metadata struct

  // Storage references (CRITICAL for V3!)
  walrus_blob_id: string;        // Where encrypted blob is stored
  seal_policy_id: string;        // Access control policy ID
  seal_allowlist_id: string | null;  // Optional: Allowlist object ID for access control

  // Metadata
  name: string;                  // Dataset name
  dataset_url: string;           // Original URL (optional)
  format: string;                // File format
  size: number;                  // File size in bytes
  schema_version: string;        // Schema version

  // Verification proof
  verification_timestamp: number; // Timestamp in milliseconds
  enclave_id: string;            // Enclave that verified
  tee_signature: string;         // Hex encoded TEE signature

  // Ownership
  owner: string;                 // Owner address
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

// V3 Architecture: Metadata verification request (NEW!)
export interface MetadataVerificationRequest {
  metadata: DatasetVerification;
}

// Helper type for converting between string and number[] (Vec<u8>)
export function stringToVecU8(str: string): number[] {
  return Array.from(new TextEncoder().encode(str));
}

export function vecU8ToString(vec: number[]): string {
  return new TextDecoder().decode(new Uint8Array(vec));
}

export function hexToVecU8(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}