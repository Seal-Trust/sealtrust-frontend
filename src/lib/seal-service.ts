import { SealClient, SessionKey } from '@mysten/seal';
import { get, set } from 'idb-keyval';
import { SuiClient } from '@mysten/sui/client';

const SEAL_SERVERS = [
  "https://seal-server-1.walrus-testnet.walrus.space",
  "https://seal-server-2.walrus-testnet.walrus.space"
];

export class SealService {
  private client: SealClient;

  constructor() {
    this.client = new SealClient({
      sealServerUrls: SEAL_SERVERS
    });
  }

  /**
   * Hash file BEFORE encryption (critical for integrity verification!)
   * @param file - File to hash
   * @returns SHA-256 hash as hex string
   */
  async hashFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Hash Uint8Array data
   * @param data - Data to hash
   * @returns SHA-256 hash as hex string
   */
  async hashData(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Encrypt dataset with Seal
   * IMPORTANT: Always hash BEFORE encryption to enable integrity verification
   * @param file - File to encrypt
   * @param packageId - Seal package ID
   * @returns Encrypted data, policy ID, and original hash
   */
  async encryptDataset(
    file: File,
    packageId: string
  ): Promise<{
    encryptedData: Uint8Array;
    policyId: string;
    originalHash: string;
  }> {
    // 1. Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // 2. Hash BEFORE encryption (critical!)
    const originalHash = await this.hashFile(file);
    console.log('Original file hash (before encryption):', originalHash);

    // 3. Generate unique policy ID for this dataset
    const policyId = crypto.randomUUID();
    console.log('Generated Seal policy ID:', policyId);

    // 4. Encrypt with Seal
    console.log('Encrypting dataset with Seal...');
    const encrypted = await this.client.encrypt({
      threshold: 2,
      packageId,
      id: policyId,
      data: new Uint8Array(fileBuffer),
    });

    console.log('Encryption complete. Encrypted size:', encrypted.encryptedObject.length);

    return {
      encryptedData: encrypted.encryptedObject,
      policyId,
      originalHash
    };
  }

  /**
   * Get or create session key with persistence
   * Session keys are valid for 10 minutes and stored in IndexedDB
   * This minimizes wallet popups for better UX
   * @param packageId - Seal package ID
   * @param address - User's wallet address
   * @param suiClient - Sui client instance
   * @param signPersonalMessage - Function to sign personal message
   * @returns Session key
   */
  async getOrCreateSessionKey(
    packageId: string,
    address: string,
    suiClient: SuiClient,
    signPersonalMessage: (msg: { message: string }) => Promise<{ signature: string }>
  ): Promise<SessionKey> {
    const key = `sessionKey_${packageId}_${address}`;

    // Try to load existing session key from IndexedDB
    try {
      const stored = await get(key);
      if (stored) {
        console.log('Found stored session key, checking validity...');
        const imported = await SessionKey.import(stored, suiClient);
        if (!imported.isExpired()) {
          console.log('✅ Reusing existing session key (no wallet popup needed)');
          return imported;
        }
        console.log('Session key expired, creating new one...');
      }
    } catch (e) {
      console.log('Stored session key invalid, creating new one...', e);
    }

    // Create new session key
    console.log('Creating new session key (10 min TTL)...');
    const sessionKey = await SessionKey.create({
      address,
      packageId,
      ttlMin: 10,
      suiClient,
    });

    // Get user signature (wallet popup - only happens every 10 min)
    console.log('⚠️ Wallet signature required for session key...');
    const { signature } = await signPersonalMessage({
      message: sessionKey.getPersonalMessage()
    });

    await sessionKey.setPersonalMessageSignature(signature);

    // Persist for reuse
    console.log('Persisting session key to IndexedDB...');
    await set(key, sessionKey.export());

    return sessionKey;
  }

  /**
   * Clear session key from storage
   * Use this when user logs out or switches accounts
   * @param packageId - Seal package ID
   * @param address - User's wallet address
   */
  async clearSessionKey(packageId: string, address: string): Promise<void> {
    const key = `sessionKey_${packageId}_${address}`;
    await set(key, null);
    console.log('Session key cleared');
  }

  /**
   * Decrypt dataset (low-level API)
   * @param encryptedData - Encrypted data from Walrus
   * @param sessionKey - Valid session key
   * @param txBytes - Transaction bytes for approval
   * @returns Decrypted data
   */
  async decryptDataset(
    encryptedData: Uint8Array,
    sessionKey: SessionKey,
    txBytes: Uint8Array
  ): Promise<Uint8Array> {
    console.log('Decrypting dataset with Seal...');
    const decrypted = await this.client.decrypt({
      data: encryptedData,
      sessionKey,
      txBytes
    });

    console.log('Decryption complete. Size:', decrypted.length);
    return decrypted;
  }

  /**
   * High-level API: Download and decrypt dataset (convenience wrapper)
   * Handles session key management, transaction preparation, and decryption
   *
   * IMPORTANT: For production Seal servers, this requires building a proper
   * approval transaction. For development/testing, empty tx bytes may work.
   *
   * @param encryptedBlob - Encrypted blob (ArrayBuffer from Walrus)
   * @param policyId - Seal policy ID from DatasetNFT
   * @param packageId - Seal package ID
   * @param allowlistPackageId - Seal allowlist package ID for approval
   * @param address - User's wallet address
   * @param suiClient - Sui client instance
   * @param signPersonalMessage - Function to sign personal message
   * @returns Decrypted data as Uint8Array
   */
  async downloadAndDecryptDataset(
    encryptedBlob: ArrayBuffer,
    policyId: string,
    packageId: string,
    allowlistPackageId: string,
    address: string,
    suiClient: SuiClient,
    signPersonalMessage: (msg: { message: string }) => Promise<{ signature: string }>
  ): Promise<Uint8Array> {
    // Get or create session key (handles IndexedDB persistence)
    const sessionKey = await this.getOrCreateSessionKey(
      packageId,
      address,
      suiClient,
      signPersonalMessage
    );

    // Build approval transaction for Seal access control
    // This is required for production Seal servers
    console.log('Building Seal approval transaction...');
    const { Transaction } = await import('@mysten/sui/transactions');
    const tx = new Transaction();

    // Call seal_approve to grant access
    // Note: This assumes you're using the allowlist pattern from Seal examples
    // Adjust the function name/module if using a different access control pattern
    tx.moveCall({
      target: `${allowlistPackageId}::allowlist::seal_approve`,
      arguments: [
        tx.object(policyId),
        tx.pure.address(address),
      ],
    });

    // Build transaction bytes for Seal verification
    const txBytes = await tx.build({ client: suiClient });
    console.log('Approval transaction built:', txBytes.length, 'bytes');

    // Convert ArrayBuffer to Uint8Array
    const encryptedData = new Uint8Array(encryptedBlob);

    // Decrypt with proper approval
    return this.decryptDataset(encryptedData, sessionKey, txBytes);
  }

  /**
   * Verify integrity after decryption
   * Compare hash of decrypted data with original hash
   * @param decryptedData - Decrypted data
   * @param expectedHash - Expected hash (stored on-chain)
   * @returns True if integrity check passes
   */
  async verifyIntegrity(
    decryptedData: Uint8Array,
    expectedHash: string
  ): Promise<boolean> {
    const actualHash = await this.hashData(decryptedData);
    const isValid = actualHash === expectedHash;

    if (isValid) {
      console.log('✅ Integrity check PASSED - file is authentic');
    } else {
      console.error('❌ Integrity check FAILED - file may be corrupted!');
      console.error('Expected hash:', expectedHash);
      console.error('Actual hash:', actualHash);
    }

    return isValid;
  }

  /**
   * Helper to create a download link for decrypted data
   * @param data - Decrypted data
   * @param filename - Filename for download
   * @param mimeType - MIME type of the file
   */
  createDownloadLink(data: Uint8Array, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const sealService = new SealService();