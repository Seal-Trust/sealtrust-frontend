import { useState, useCallback } from "react";
import {
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { CONFIG, ERROR_MESSAGES, GAS_BUDGET } from "../lib/constants";
import {
  DatasetNFT,
  RegistryEntry,
  ServiceState,
  VerificationResult,
} from "../lib/types";
import { hexToBytes, stringToBytes, bytesToString, bytesToHex } from "../lib/utils/crypto";

// Type definitions for Sui object responses
interface SuiObjectChange {
  objectId: string;
  objectType?: string;
}

interface SuiObjectContent {
  dataType: string;
  fields: {
    original_hash?: number[];
    metadata_hash?: number[];
    walrus_blob_id?: string;
    seal_policy_id?: string;
    seal_allowlist_id?: string;
    name?: string;
    dataset_url?: string;
    format?: string;
    size?: string;
    schema_version?: string;
    verification_timestamp?: string;
    enclave_id?: string;
    tee_signature?: number[];
    [key: string]: unknown;
  };
}

interface SuiObjectOwner {
  AddressOwner?: string;
  ObjectOwner?: string;
  Shared?: {
    initial_shared_version: string;
  };
}

/**
 * Main hook for TruthMarket blockchain operations
 */
export function useTruthMarket() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * PRODUCTION: Register a dataset on-chain with full Nautilus TEE verification
   * This calls register_dataset which verifies the signature on-chain
   */
  const registerDatasetProduction = useCallback(async (params: {
    datasetId: string;
    name: string;
    description: string;
    format: string;
    size: number;
    originalHash: string;        // Hex string of hash
    metadataHash: string;        // Hex string
    walrusBlobId: string;
    sealPolicyId: string;
    sealAllowlistId?: string;    // Optional
    timestampMs: number;
    teeSignature: string;        // Hex encoded signature from Nautilus
  }): Promise<{ txDigest: string; nftId: string } | null> => {
    if (!account) {
      setError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return null;
    }

    setRegistering(true);
    setError(null);

    try {
      const tx = new Transaction();

      // Convert hex signature to bytes
      const sigBytes = hexToBytes(params.teeSignature);

      console.log("Production Registration parameters:", {
        datasetId: params.datasetId,
        name: params.name,
        size: params.size,
        originalHash: params.originalHash.substring(0, 20) + "...",
        walrusBlobId: params.walrusBlobId.substring(0, 20) + "...",
        timestampMs: params.timestampMs,
        signatureLength: sigBytes.length,
        enclaveId: CONFIG.ENCLAVE_ID,
        packageId: CONFIG.VERIFICATION_PACKAGE,
      });

      // Build arguments for register_dataset
      const args = [
        tx.pure.vector("u8", stringToBytes(params.datasetId)),      // dataset_id
        tx.pure.vector("u8", stringToBytes(params.name)),           // name
        tx.pure.vector("u8", stringToBytes(params.description)),    // description
        tx.pure.vector("u8", stringToBytes(params.format)),         // format
        tx.pure.u64(params.size),                                   // size
        tx.pure.vector("u8", hexToBytes(params.originalHash)),      // original_hash
        tx.pure.vector("u8", hexToBytes(params.metadataHash)),      // metadata_hash
        tx.pure.string(params.walrusBlobId),                        // walrus_blob_id (String)
        tx.pure.string(params.sealPolicyId),                        // seal_policy_id (String)
        // seal_allowlist_id: Option<ID>
        params.sealAllowlistId
          ? tx.pure.option("address", params.sealAllowlistId)
          : tx.pure.option("address", null),
        tx.pure.u64(params.timestampMs),                            // timestamp_ms
        tx.pure.vector("u8", sigBytes),                             // tee_signature
        tx.object(CONFIG.ENCLAVE_ID),                               // enclave: &Enclave<T>
      ];

      // Call production register_dataset function (verifies signature on-chain)
      const [nft] = tx.moveCall({
        target: `${CONFIG.VERIFICATION_PACKAGE}::truthmarket::register_dataset`,
        typeArguments: [`${CONFIG.VERIFICATION_PACKAGE}::truthmarket::TRUTHMARKET`],
        arguments: args,
      });

      // Transfer the NFT to the user
      tx.transferObjects([nft], tx.pure.address(account.address));

      tx.setGasBudget(GAS_BUDGET);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log("Production transaction result:", JSON.stringify(result, null, 2));

      if (!result.digest) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
      }

      // Query the transaction to get the created NFT ID
      const txResponse = await suiClient.getTransactionBlock({
        digest: result.digest,
        options: {
          showObjectChanges: true,
        },
      });

      const createdNft = txResponse.objectChanges?.find(
        (change) => change.type === "created" &&
                        'objectType' in change &&
                        change.objectType?.includes("DatasetNFT")
      );

      const nftId = (createdNft && 'objectId' in createdNft) ? createdNft.objectId : "";

      setRegistering(false);
      return {
        txDigest: result.digest,
        nftId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.TRANSACTION_FAILED;
      console.error("Production registration error:", err);
      setError(message);
      setRegistering(false);
      return null;
    }
  }, [account, signAndExecute, suiClient]);

  /**
   * DEV ONLY: Register a dataset on-chain (skips signature verification)
   * Use registerDatasetProduction for production deployments
   */
  const registerDatasetDev = useCallback(async (
    datasetUrl: string,
    hash: string,
    format: string,
    schemaVersion: string,
    timestamp: number,
    signature: string
  ): Promise<{ txDigest: string; nftId: string } | null> => {
    if (!account) {
      setError(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return null;
    }

    setRegistering(true);
    setError(null);

    try {
      const tx = new Transaction();

      // Convert signature from hex to bytes
      const sigBytes = hexToBytes(signature);

      console.log("DEV Registration parameters:", {
        datasetUrl,
        hash,
        format,
        schemaVersion,
        timestamp,
        signature: signature.substring(0, 20) + "...",
        signatureLength: sigBytes.length,
        enclaveConfigId: CONFIG.ENCLAVE_CONFIG_ID,
        packageId: CONFIG.VERIFICATION_PACKAGE,
      });

      // Call register_dataset_dev function (DEV ONLY - skips signature verification)
      const [nft] = tx.moveCall({
        target: `${CONFIG.VERIFICATION_PACKAGE}::truthmarket::register_dataset_dev`,
        typeArguments: [`${CONFIG.VERIFICATION_PACKAGE}::truthmarket::TRUTHMARKET`],
        arguments: [
          tx.pure.vector("u8", hexToBytes(hash)), // dataset_hash
          tx.pure.vector("u8", stringToBytes(datasetUrl)), // dataset_url
          tx.pure.vector("u8", stringToBytes(format)), // format
          tx.pure.vector("u8", stringToBytes(schemaVersion)), // schema_version
          tx.pure.u64(timestamp), // timestamp_ms
          tx.pure.vector("u8", sigBytes), // signature (unused in dev version)
          tx.object(CONFIG.ENCLAVE_CONFIG_ID), // enclave_config object (NOT Enclave)
        ],
      });

      // Transfer the NFT to the user
      tx.transferObjects([nft], tx.pure.address(account.address));

      tx.setGasBudget(GAS_BUDGET);

      const result = await signAndExecute({
        transaction: tx,
      });

      console.log("DEV Transaction result:", JSON.stringify(result, null, 2));

      if (!result.digest) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_FAILED);
      }

      // Query the transaction to get the created NFT ID
      const txResponse = await suiClient.getTransactionBlock({
        digest: result.digest,
        options: {
          showObjectChanges: true,
        },
      });

      const createdNft = txResponse.objectChanges?.find(
        (change) => change.type === "created" &&
                        'objectType' in change &&
                        change.objectType?.includes("DatasetNFT")
      );

      const nftId = (createdNft && 'objectId' in createdNft) ? createdNft.objectId : "";

      setRegistering(false);
      return {
        txDigest: result.digest,
        nftId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.TRANSACTION_FAILED;
      setError(message);
      setRegistering(false);
      return null;
    }
  }, [account, signAndExecute, suiClient]);

  /**
   * Register a dataset - automatically uses production or dev based on config
   */
  const registerDataset = useCallback(async (
    datasetUrl: string,
    hash: string,
    format: string,
    schemaVersion: string,
    timestamp: number,
    signature: string
  ): Promise<{ txDigest: string; nftId: string } | null> => {
    // For backwards compatibility, use dev mode
    // Production code should call registerDatasetProduction directly
    return registerDatasetDev(datasetUrl, hash, format, schemaVersion, timestamp, signature);
  }, [registerDatasetDev]);

  /**
   * Verify if a dataset hash exists on-chain
   */
  const verifyDataset = useCallback(async (
    hash: string
  ): Promise<VerificationResult> => {
    setVerifying(true);
    setError(null);

    try {
      // Query transactions that called register_dataset (production only)
      const txBlocks = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: CONFIG.VERIFICATION_PACKAGE,
            module: "truthmarket",
            function: "register_dataset",
          },
        },
        options: {
          showObjectChanges: true,
          showInput: true,
        },
        limit: 100,
      });

      // Search through created NFTs for matching hash
      for (const txBlock of txBlocks.data) {
        const objectChanges = txBlock.objectChanges || [];

        for (const change of objectChanges) {
          if (
            change.type === "created" &&
            change.objectType?.includes("DatasetNFT")
          ) {
            // Get the NFT object details
            const objectResponse = await suiClient.getObject({
              id: (change as SuiObjectChange).objectId,
              options: {
                showContent: true,
                showOwner: true,
              },
            });

            if (objectResponse.data?.content) {
              const content = objectResponse.data.content as SuiObjectContent;
              const nftHash = bytesToHex(content.fields.original_hash || []);

              // Check if this NFT's hash matches
              if (nftHash === hash) {
                const owner = objectResponse.data.owner as SuiObjectOwner;

                const dataset: DatasetNFT = {
                  id: (change as SuiObjectChange).objectId,
                  original_hash: hash,
                  metadata_hash: bytesToHex(content.fields.metadata_hash || []),
                  walrus_blob_id: content.fields.walrus_blob_id || "",
                  seal_policy_id: content.fields.seal_policy_id || "",
                  seal_allowlist_id: content.fields.seal_allowlist_id || "",
                  name: content.fields.name || "",
                  dataset_url: content.fields.dataset_url || "",
                  format: content.fields.format || "",
                  size: parseInt(content.fields.size || "0"),
                  schema_version: content.fields.schema_version || "",
                  verification_timestamp: parseInt(content.fields.verification_timestamp || "0"),
                  enclave_id: content.fields.enclave_id || "",
                  tee_signature: bytesToHex(content.fields.tee_signature || []),
                  owner: owner?.AddressOwner || "",
                };

                setVerifying(false);
                return {
                  found: true,
                  dataset,
                  registrant: owner?.AddressOwner || "",
                  tx_digest: txBlock.digest,
                };
              }
            }
          }
        }
      }

      setVerifying(false);
      return {
        found: false,
        dataset: null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : ERROR_MESSAGES.NETWORK_ERROR;
      setError(message);
      setVerifying(false);
      return {
        found: false,
        dataset: null,
      };
    }
  }, [suiClient]);

  /**
   * Get all registered datasets from the blockchain
   */
  const getAllDatasets = useCallback(async (): Promise<RegistryEntry[]> => {
    try {
      // Query all transactions that called register_dataset (production only)
      const txBlocks = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: CONFIG.VERIFICATION_PACKAGE,
            module: "truthmarket",
            function: "register_dataset",
          },
        },
        options: {
          showObjectChanges: true,
          showInput: true,
        },
        limit: 100,
      });

      const entries: RegistryEntry[] = [];

      // Process each transaction to find created NFTs
      for (const txBlock of txBlocks.data) {
        const objectChanges = txBlock.objectChanges || [];

        for (const change of objectChanges) {
          if (
            change.type === "created" &&
            change.objectType?.includes("DatasetNFT")
          ) {
            // Get the NFT object details
            const objectResponse = await suiClient.getObject({
              id: (change as SuiObjectChange).objectId,
              options: {
                showContent: true,
                showOwner: true,
              },
            });

            if (objectResponse.data?.content) {
              const content = objectResponse.data.content as SuiObjectContent;
              const owner = objectResponse.data.owner as SuiObjectOwner;

              const nft: DatasetNFT = {
                id: (change as SuiObjectChange).objectId,
                original_hash: bytesToHex(content.fields.original_hash || []),
                metadata_hash: bytesToHex(content.fields.metadata_hash || []),
                walrus_blob_id: content.fields.walrus_blob_id || "",
                seal_policy_id: content.fields.seal_policy_id || "",
                seal_allowlist_id: content.fields.seal_allowlist_id || "",
                name: content.fields.name || "",
                dataset_url: content.fields.dataset_url || "",
                format: content.fields.format || "",
                size: parseInt(content.fields.size || "0"),
                schema_version: content.fields.schema_version || "",
                verification_timestamp: parseInt(content.fields.verification_timestamp || "0"),
                enclave_id: content.fields.enclave_id || "",
                tee_signature: bytesToHex(content.fields.tee_signature || []),
                owner: owner?.AddressOwner || "",
              };

              entries.push({
                id: (change as SuiObjectChange).objectId,
                nft,
                registrant: owner?.AddressOwner || "",
                tx_digest: txBlock.digest,
                registered_at: nft.verification_timestamp,
              });
            }
          }
        }
      }

      // Sort by timestamp (newest first)
      return entries.sort((a, b) => b.registered_at - a.registered_at);
    } catch (err) {
      console.error("Error fetching datasets:", err);
      return [];
    }
  }, [suiClient]);

  /**
   * Get datasets registered by a specific address
   */
  const getDatasetsByOwner = useCallback(async (
    address: string
  ): Promise<RegistryEntry[]> => {
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${CONFIG.VERIFICATION_PACKAGE}::truthmarket::DatasetNFT`,
        },
        options: {
          showContent: true,
        },
      });

      const entries: RegistryEntry[] = [];

      for (const obj of objects.data) {
        if (obj.data?.content) {
          const content = obj.data.content as SuiObjectContent;

          const nft: DatasetNFT = {
            id: obj.data.objectId,
            original_hash: bytesToHex(content.fields.original_hash || []),
            metadata_hash: bytesToHex(content.fields.metadata_hash || []),
            walrus_blob_id: content.fields.walrus_blob_id || "",
            seal_policy_id: content.fields.seal_policy_id || "",
            seal_allowlist_id: content.fields.seal_allowlist_id || "",
            name: content.fields.name || "",
            dataset_url: content.fields.dataset_url || "",
            format: content.fields.format || "",
            size: parseInt(content.fields.size || "0"),
            schema_version: content.fields.schema_version || "",
            verification_timestamp: parseInt(content.fields.verification_timestamp || "0"),
            enclave_id: content.fields.enclave_id || "",
            tee_signature: bytesToHex(content.fields.tee_signature || []),
            owner: address,
          };

          entries.push({
            id: obj.data.objectId,
            nft,
            registrant: address,
            tx_digest: obj.data.digest || "",
            registered_at: nft.verification_timestamp,
          });
        }
      }

      return entries.sort((a, b) => b.registered_at - a.registered_at);
    } catch (err) {
      console.error("Error fetching user datasets:", err);
      return [];
    }
  }, [suiClient]);

  /**
   * Get details of a specific dataset NFT
   */
  const getDatasetDetails = useCallback(async (
    nftId: string
  ): Promise<DatasetNFT | null> => {
    try {
      const object = await suiClient.getObject({
        id: nftId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (object.data?.content) {
        const content = object.data.content as SuiObjectContent;
        const owner = object.data.owner as SuiObjectOwner;

        return {
          id: nftId,
          original_hash: bytesToHex(content.fields.original_hash || []),
          metadata_hash: bytesToHex(content.fields.metadata_hash || []),
          walrus_blob_id: content.fields.walrus_blob_id || "",
          seal_policy_id: content.fields.seal_policy_id || "",
          seal_allowlist_id: content.fields.seal_allowlist_id || "",
          name: content.fields.name || "",
          dataset_url: content.fields.dataset_url || "",
          format: content.fields.format || "",
          size: parseInt(content.fields.size || "0"),
          schema_version: content.fields.schema_version || "",
          verification_timestamp: parseInt(content.fields.verification_timestamp || "0"),
          enclave_id: content.fields.enclave_id || "",
          tee_signature: bytesToHex(content.fields.tee_signature || []),
          owner: owner?.AddressOwner || "",
        };
      }

      return null;
    } catch {
      return null;
    }
  }, [suiClient]);

  return {
    // State
    registering,
    verifying,
    error,
    isConnected: !!account,
    address: account?.address,

    // Functions
    registerDataset,              // Backwards compatible (uses dev mode)
    registerDatasetProduction,    // PRODUCTION: Full TEE verification
    registerDatasetDev,           // DEV ONLY: Skips signature verification
    verifyDataset,
    getAllDatasets,
    getDatasetsByOwner,
    getDatasetDetails,
  };
}