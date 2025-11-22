import { useState, useCallback } from "react";
import { CONFIG, ERROR_MESSAGES } from "~~/lib/constants";
import {
  ProcessDataRequest,
  ProcessedDataResponse,
  ServiceState,
  NautilusError,
} from "~~/lib/types";

interface NautilusVerification {
  hash: string;
  signature: string;
  timestamp: number;
  enclave_key: string;
}

// V3 Architecture: Full metadata verification response
interface MetadataVerificationResult {
  datasetId: string;
  name: string;
  description: string;
  format: string;
  size: number;
  originalHash: string;
  walrusBlobId: string;
  sealPolicyId: string;
  timestamp: number;
  uploader: string;
  signature: string;  // Hex encoded TEE signature
}

/**
 * Hook for interacting with Nautilus TEE
 */
export function useNautilus() {
  const [state, setState] = useState<ServiceState<NautilusVerification>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Verify dataset with Nautilus TEE
   */
  const verifyDataset = useCallback(async (
    datasetUrl: string,
    format: string = "CSV",
    schemaVersion: string = "v1.0",
    expectedHash?: string
  ): Promise<NautilusVerification | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      const request: ProcessDataRequest = {
        payload: {
          dataset_url: datasetUrl,
          expected_hash: expectedHash,
          format,
          schema_version: schemaVersion,
        },
      };

      const response = await fetch(`${CONFIG.NAUTILUS_URL}/process_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error: NautilusError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || ERROR_MESSAGES.NAUTILUS_UNAVAILABLE);
      }

      const result: ProcessedDataResponse = await response.json();

      // Extract hash from the verification data
      const hashBytes = result.response.data.original_hash;
      const hashHex = hashBytes
        .map((b: number) => b.toString(16).padStart(2, "0"))
        .join("");

      const verification: NautilusVerification = {
        hash: hashHex,
        signature: result.signature,
        timestamp: result.response.timestamp_ms,
        enclave_key: "", // Not returned by dev server, will be populated from enclave object in production
      };

      setState({ data: verification, loading: false, error: null });
      return verification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NAUTILUS_UNAVAILABLE;
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * V3 PRODUCTION: Verify metadata with Nautilus TEE
   * This is the recommended endpoint for production use
   */
  const verifyMetadata = useCallback(async (metadata: {
    dataset_id: string;
    name: string;
    description: string;
    format: string;
    size: number;
    original_hash: string;      // Hex string
    walrus_blob_id: string;
    seal_policy_id: string;
    timestamp: number;
    uploader: string;           // Sui address
  }): Promise<MetadataVerificationResult | null> => {
    setState({ data: null, loading: true, error: null });

    try {
      // Convert hex hash to byte array for the request
      const hashBytes = metadata.original_hash.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || [];

      const request = {
        metadata: {
          dataset_id: Array.from(new TextEncoder().encode(metadata.dataset_id)),
          name: Array.from(new TextEncoder().encode(metadata.name)),
          description: Array.from(new TextEncoder().encode(metadata.description)),
          format: Array.from(new TextEncoder().encode(metadata.format)),
          size: metadata.size,
          original_hash: hashBytes,
          walrus_blob_id: Array.from(new TextEncoder().encode(metadata.walrus_blob_id)),
          seal_policy_id: Array.from(new TextEncoder().encode(metadata.seal_policy_id)),
          timestamp: metadata.timestamp,
          uploader: Array.from(new TextEncoder().encode(metadata.uploader)),
        },
      };

      console.log("Calling Nautilus /verify_metadata:", {
        url: `${CONFIG.NAUTILUS_URL}/verify_metadata`,
        datasetId: metadata.dataset_id,
        name: metadata.name,
        size: metadata.size,
      });

      const response = await fetch(`${CONFIG.NAUTILUS_URL}/verify_metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(error.error || ERROR_MESSAGES.NAUTILUS_UNAVAILABLE);
      }

      const result = await response.json();

      // The signature from Nautilus is hex encoded
      const verification: MetadataVerificationResult = {
        datasetId: metadata.dataset_id,
        name: metadata.name,
        description: metadata.description,
        format: metadata.format,
        size: metadata.size,
        originalHash: metadata.original_hash,
        walrusBlobId: metadata.walrus_blob_id,
        sealPolicyId: metadata.seal_policy_id,
        timestamp: result.response.timestamp_ms,
        uploader: metadata.uploader,
        signature: result.signature,  // Already hex encoded
      };

      console.log("Nautilus verification successful:", {
        timestamp: verification.timestamp,
        signatureLength: verification.signature.length,
      });

      setState({ data: null, loading: false, error: null });
      return verification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.NAUTILUS_UNAVAILABLE;
      console.error("Nautilus verification failed:", errorMessage);
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, []);

  /**
   * Health check for Nautilus service
   */
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${CONFIG.NAUTILUS_URL}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  /**
   * Get attestation document from enclave
   */
  const getAttestation = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(`${CONFIG.NAUTILUS_URL}/get_attestation`, {
        method: "GET",
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.attestation;
    } catch {
      return null;
    }
  }, []);

  /**
   * Parse signature for Move contract submission
   */
  const parseSignatureForMove = useCallback((signature: string): number[] => {
    // Base64 decode and convert to byte array
    try {
      const decoded = atob(signature);
      const bytes: number[] = [];
      for (let i = 0; i < decoded.length; i++) {
        bytes.push(decoded.charCodeAt(i));
      }
      return bytes;
    } catch {
      throw new Error("Invalid signature format");
    }
  }, []);

  return {
    state,
    // Legacy endpoint (process_data)
    verifyDataset,
    // V3 Production endpoint (verify_metadata) - RECOMMENDED
    verifyMetadata,
    // Utilities
    checkHealth,
    getAttestation,
    parseSignatureForMove,
  };
}

// Export types for consumers
export type { NautilusVerification, MetadataVerificationResult };