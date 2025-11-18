import { useState, useCallback } from "react";
import { CONFIG, ERROR_MESSAGES } from "~~/lib/constants";
import {
  DatasetRequest,
  ProcessDataRequest,
  ProcessedDataResponse,
  ServiceState,
  NautilusError,
} from "~~/lib/types";
import { hexToBytes } from "~~/lib/utils/crypto";

interface NautilusVerification {
  hash: string;
  signature: string;
  timestamp: number;
  enclave_key: string;
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
    verifyDataset,
    checkHealth,
    parseSignatureForMove,
  };
}