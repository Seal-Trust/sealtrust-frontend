/**
 * Walrus Service - V3 Architecture
 *
 * Simple HTTP-based service for uploading/downloading blobs to/from Walrus.
 * We use direct HTTP endpoints (NOT SDK, NOT relay).
 *
 * Upload: HTTP PUT to publisher endpoint
 * Download: HTTP GET from aggregator endpoint
 */

// Walrus testnet configuration
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

class WalrusService {
  /**
   * Upload a file to Walrus storage via HTTP PUT
   *
   * This uploads the file directly to the Walrus publisher endpoint.
   * In V3, we upload ENCRYPTED blobs (after Seal encryption).
   *
   * @param file - File to upload (should be encrypted blob)
   * @param epochs - Number of epochs to store (default: 5)
   * @returns blobId and blobUrl for the stored file
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
   * Download a blob from Walrus via HTTP GET
   *
   * This downloads the file from the Walrus aggregator endpoint.
   * In V3, we download ENCRYPTED blobs (before Seal decryption).
   *
   * @param blobId - Blob ID to download
   * @returns ArrayBuffer containing the blob data (encrypted)
   */
  async downloadFromWalrus(blobId: string): Promise<ArrayBuffer> {
    const response = await fetch(`${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`);

    if (!response.ok) {
      throw new Error(`Failed to download from Walrus: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Format file size for display (utility function)
   *
   * @param bytes - File size in bytes
   * @returns Formatted string (e.g., "1.23 MB")
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Export singleton instance
export const walrusService = new WalrusService();
