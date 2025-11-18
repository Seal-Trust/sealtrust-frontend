import { SealClient, SessionKey } from '@mysten/seal';
import { get, set } from 'idb-keyval';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { fromHex } from '@mysten/sui/utils';

// Official Seal Testnet Key Servers (as of 2025)
// Verified providers: Mysten Labs, Ruby Nodes, NodeInfra, Overclock, H2O Nodes
const TESTNET_KEY_SERVERS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75', // mysten-testnet-1
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8', // mysten-testnet-2
  '0x6068c0acb197dddbacd4746a9de7f025b2ed5a5b6c1b1ab44dade4426d141da2', // Ruby Nodes
  '0x5466b7df5c15b508678d51496ada8afab0d6f70a01c10613123382b1b8131007', // NodeInfra
  '0x9c949e53c36ab7a9c484ed9e8b43267a77d4b8d70e79aa6b39042e3d4c434105', // Overclock
  '0x39cef09b24b667bc6ed54f7159d82352fe2d5dd97ca9a5beaa1d21aa774f25a2', // H2O Nodes
];

export class SealService {
  private client: SealClient | null = null;
  private suiClient: SuiClient | null = null;

  /**
   * Initialize the SealClient with testnet key servers
   * Must be called before using encrypt/decrypt operations
   *
   * NOTE: We create a fresh SuiClient instance instead of using the dapp-kit client
   * because SealClient requires a client with experimental core extensions
   */
  async initialize(): Promise<void> {
    if (this.client) {
      // Already initialized
      return;
    }

    // Create a fresh SuiClient instance compatible with Seal
    // This is the same pattern used in Seal's integration tests
    this.suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

    console.log('🔐 Initializing Seal with', TESTNET_KEY_SERVERS.length, 'key servers');

    this.client = new SealClient({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suiClient: this.suiClient as any, // Type cast due to Seal's specific client requirements
      serverConfigs: TESTNET_KEY_SERVERS.map(objectId => ({
        objectId,
        weight: 1, // Equal weight for all servers
      })),
      verifyKeyServers: false, // Disable verification to avoid network issues
      timeout: 10000, // 10 second timeout
    });
  }

  private getClient(): SealClient {
    if (!this.client) {
      throw new Error('SealService not initialized. Call initialize(suiClient) first.');
    }
    return this.client;
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
    // Ensure data is properly typed for crypto API
    const dataToHash = new Uint8Array(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataToHash);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Encrypt dataset with Seal
   * IMPORTANT: Always hash BEFORE encryption to enable integrity verification
   * @param file - File to encrypt
   * @param packageId - Seal package ID
   * @param allowlistId - Allowlist object ID (namespace for policy ID)
   * @returns Encrypted data, policy ID, and original hash
   */
  async encryptDataset(
    file: File,
    packageId: string,
    allowlistId: string
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

    // 3. Generate policy ID with allowlist namespace prefix
    // Import allowlistService to avoid code duplication
    const { allowlistService } = await import('./allowlist-service');
    const policyId = allowlistService.generatePolicyId(allowlistId);

    console.log('Generated Seal policy ID (hex):', policyId);

    // 4. Encrypt with Seal
    console.log('Encrypting dataset with Seal...');
    const encrypted = await this.getClient().encrypt({
      threshold: 2,
      packageId,  // Keep as hex string
      id: policyId,  // Keep as hex string
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imported = await SessionKey.import(stored, suiClient as any);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suiClient: suiClient as any, // Type cast due to Seal's specific client requirements
    });

    // Get user signature (wallet popup - only happens every 10 min)
    console.log('⚠️ Wallet signature required for session key...');
    // Convert Uint8Array message to base64 string for signing
    const messageBytes = sessionKey.getPersonalMessage();
    const messageBase64 = btoa(String.fromCharCode(...messageBytes));
    const { signature } = await signPersonalMessage({
      message: messageBase64
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
    const decrypted = await this.getClient().decrypt({
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
   * @param allowlistId - Allowlist object ID for access control
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
    allowlistId: string,
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
    // This follows the official Seal pattern from AllowlistView.tsx
    console.log('Building Seal approval transaction...');
    console.log('  Policy ID:', policyId);
    console.log('  Allowlist ID:', allowlistId);
    const { Transaction } = await import('@mysten/sui/transactions');
    const tx = new Transaction();

    // Call seal_approve to grant access
    // CRITICAL: Arguments must be [policyId_bytes, allowlist_object]
    // This matches the official Seal example pattern
    tx.moveCall({
      target: `${allowlistPackageId}::allowlist::seal_approve`,
      arguments: [
        tx.pure.vector('u8', fromHex(policyId)),  // Policy ID as bytes vector
        tx.object(allowlistId),                    // Allowlist shared object
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
    // Ensure data is properly typed for Blob constructor
    const dataForBlob = new Uint8Array(data);
    const blob = new Blob([dataForBlob], { type: mimeType });
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