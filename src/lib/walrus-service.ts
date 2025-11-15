import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { CONFIG } from './constants';
import { DatasetNFT, RegistryEntry } from './types';
import { bytesToHex, bytesToString } from './utils/crypto';

// Walrus testnet configuration
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

class WalrusService {
  private suiClient: SuiClient;

  constructor() {
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });
  }

  /**
   * Upload a file to Walrus storage
   * Returns the blob ID for the stored file
   */
  async uploadToWalrus(file: File, epochs: number = 5): Promise<{ blobId: string; blobUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=${epochs}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to Walrus: ${response.statusText}`);
    }

    const result = await response.json();
    const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;

    if (!blobId) {
      throw new Error('Failed to get blob ID from Walrus response');
    }

    return {
      blobId,
      blobUrl: `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`,
    };
  }

  /**
   * Download a blob from Walrus
   */
  async downloadFromWalrus(blobId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);

    if (!response.ok) {
      throw new Error(`Failed to download from Walrus: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Calculate SHA-256 hash of a file
   */
  async calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Get registry statistics by querying actual DatasetNFTs
   */
  async getRegistryStats(): Promise<{
    totalDatasets: number;
    totalDataSize: number;
    todaysRegistrations: number;
  }> {
    try {
      // Query all DatasetNFT creation transactions
      const txBlocks = await this.suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: CONFIG.VERIFICATION_PACKAGE,
            module: "truthmarket",
            function: "register_dataset_dev",
          },
        },
        options: {
          showObjectChanges: true,
        },
        limit: 100,
      });

      let totalDatasets = 0;
      let todaysRegistrations = 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = today.getTime();

      // Count DatasetNFTs created
      for (const block of txBlocks.data) {
        const objectChanges = block.objectChanges || [];

        for (const change of objectChanges) {
          if (change.type === 'created' &&
              change.objectType?.includes('DatasetNFT')) {
            totalDatasets++;

            // Get the full object to check timestamp for today's count
            const obj = await this.suiClient.getObject({
              id: change.objectId,
              options: {
                showContent: true,
              },
            });

            if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
              const fields = obj.data.content.fields as any;
              const timestamp = Number(fields.verification_timestamp);

              // Count today's registrations
              if (timestamp >= todayTimestamp) {
                todaysRegistrations++;
              }
            }
          }
        }
      }

      // Note: We don't have actual file size data stored on-chain,
      // so we can't calculate totalDataSize accurately
      return {
        totalDatasets,
        totalDataSize: 0, // Not available without storing size in NFT
        todaysRegistrations,
      };
    } catch (error) {
      console.error('Error fetching registry stats:', error);
      return {
        totalDatasets: 0,
        totalDataSize: 0,
        todaysRegistrations: 0,
      };
    }
  }

  /**
   * Query all datasets from the blockchain
   * NO MOCKS - queries real DatasetNFTs
   */
  async queryDatasets(): Promise<RegistryEntry[]> {
    try {
      // Query all transactions that created DatasetNFTs
      const txBlocks = await this.suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: CONFIG.VERIFICATION_PACKAGE,
            module: "truthmarket",
            function: "register_dataset_dev",
          },
        },
        options: {
          showObjectChanges: true,
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
            const objectResponse = await this.suiClient.getObject({
              id: (change as any).objectId,
              options: {
                showContent: true,
                showOwner: true,
              },
            });

            if (objectResponse.data?.content) {
              const content = objectResponse.data.content as any;
              const owner = objectResponse.data.owner as any;

              const nft: DatasetNFT = {
                id: (change as any).objectId,
                dataset_hash: bytesToHex(content.fields.dataset_hash || []),
                dataset_url: bytesToString(content.fields.dataset_url || []),
                format: content.fields.format || "",
                schema_version: content.fields.schema_version || "",
                verification_timestamp: parseInt(content.fields.verification_timestamp || "0"),
                enclave_id: content.fields.enclave_id || "",
                owner: owner?.AddressOwner || "",
              };

              entries.push({
                id: (change as any).objectId,
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
    } catch (error) {
      console.error('Error querying datasets:', error);
      return [];
    }
  }

  /**
   * Verify a dataset by searching for DatasetNFT with matching hash
   * NO MOCKS - queries real blockchain
   */
  async verifyDataset(hash: string): Promise<{
    found: boolean;
    dataset: DatasetNFT | null;
    tx_digest?: string;
  }> {
    try {
      // Query transactions that created DatasetNFTs
      const txBlocks = await this.suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: CONFIG.VERIFICATION_PACKAGE,
            module: "truthmarket",
            function: "register_dataset_dev",
          },
        },
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
        limit: 100,
      });

      // Search through created DatasetNFTs for matching hash
      for (const block of txBlocks.data) {
        const objectChanges = block.objectChanges || [];

        for (const change of objectChanges) {
          if (change.type === 'created' &&
              change.objectType?.includes('DatasetNFT')) {

            // Get the full object to check its hash
            const obj = await this.suiClient.getObject({
              id: change.objectId,
              options: {
                showContent: true,
                showOwner: true,
              },
            });

            if (obj.data?.content && obj.data.content.dataType === 'moveObject') {
              const fields = obj.data.content.fields as any;
              const owner = obj.data.owner as any;
              const nftHash = bytesToHex(fields.dataset_hash || []);

              if (nftHash === hash) {
                // Dataset verified! Return details
                const dataset: DatasetNFT = {
                  id: change.objectId,
                  dataset_hash: nftHash,
                  dataset_url: bytesToString(fields.dataset_url || []),
                  format: fields.format || "",
                  schema_version: fields.schema_version || "",
                  verification_timestamp: parseInt(fields.verification_timestamp || "0"),
                  enclave_id: fields.enclave_id || "",
                  owner: owner?.AddressOwner || "",
                };

                return {
                  found: true,
                  dataset,
                  tx_digest: block.digest,
                };
              }
            }
          }
        }
      }

      return { found: false, dataset: null };
    } catch (error) {
      console.error('Error verifying dataset:', error);
      return { found: false, dataset: null };
    }
  }
}

// Export singleton instance
export const walrusService = new WalrusService();