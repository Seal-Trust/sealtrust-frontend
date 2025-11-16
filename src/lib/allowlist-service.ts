import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';
import { fromHex, toHex } from '@mysten/sui/utils';

/**
 * Allowlist Service for Managing Access Control
 *
 * Handles creation and management of Seal allowlists for dataset access control.
 * Each dataset has its own allowlist that controls who can decrypt it.
 */

export interface AllowlistResult {
  allowlistId: string;
  capId: string;
  digest: string;
}

export interface AddUserResult {
  digest: string;
  success: boolean;
}

export class AllowlistService {
  /**
   * Create a new allowlist for a dataset
   * Returns the allowlist ID (shared object) and cap ID (admin capability)
   *
   * @param name - Name for the allowlist (e.g., "Access for my-dataset.csv")
   * @param packageId - Seal allowlist package ID
   * @param signAndExecuteTransaction - Function from useSuiClient to execute tx
   * @returns Allowlist ID and Cap ID
   */
  async createAllowlist(
    name: string,
    packageId: string,
    signAndExecuteTransaction: (args: {
      transaction: Transaction;
      chain: string;
    }) => Promise<any>
  ): Promise<AllowlistResult> {
    console.log('Creating allowlist:', name);

    const tx = new Transaction();

    // Call create_allowlist_entry which creates allowlist and sends cap to sender
    tx.moveCall({
      target: `${packageId}::allowlist::create_allowlist_entry`,
      arguments: [
        tx.pure.string(name),
      ],
    });

    // Execute transaction
    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet',
    });

    console.log('Allowlist creation result:', result);

    // Extract object IDs from transaction effects
    const { objectChanges } = result.effects || result;
    if (!objectChanges) {
      throw new Error('No object changes in transaction result');
    }

    // Find the created Allowlist (shared object)
    const allowlistChange = objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType?.includes('::allowlist::Allowlist')
    );

    // Find the created Cap (owned object)
    const capChange = objectChanges.find(
      (change: any) =>
        change.type === 'created' &&
        change.objectType?.includes('::allowlist::Cap')
    );

    if (!allowlistChange || !capChange) {
      throw new Error('Failed to extract allowlist or cap from transaction');
    }

    const allowlistId = allowlistChange.objectId;
    const capId = capChange.objectId;

    console.log('✅ Allowlist created:', allowlistId);
    console.log('✅ Admin cap:', capId);

    return {
      allowlistId,
      capId,
      digest: result.digest,
    };
  }

  /**
   * Add a user to the allowlist (requires admin cap)
   *
   * @param allowlistId - ID of the allowlist shared object
   * @param capId - ID of the admin capability object
   * @param userAddress - Address to add to allowlist
   * @param packageId - Seal allowlist package ID
   * @param signAndExecuteTransaction - Function to execute tx
   */
  async addUser(
    allowlistId: string,
    capId: string,
    userAddress: string,
    packageId: string,
    signAndExecuteTransaction: (args: {
      transaction: Transaction;
      chain: string;
    }) => Promise<any>
  ): Promise<AddUserResult> {
    console.log(`Adding ${userAddress} to allowlist ${allowlistId}`);

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::allowlist::add`,
      arguments: [
        tx.object(allowlistId),      // Shared allowlist object
        tx.object(capId),             // Admin capability
        tx.pure.address(userAddress), // User to add
      ],
    });

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet',
    });

    console.log('✅ User added to allowlist');

    return {
      digest: result.digest,
      success: true,
    };
  }

  /**
   * Remove a user from the allowlist (requires admin cap)
   *
   * @param allowlistId - ID of the allowlist shared object
   * @param capId - ID of the admin capability object
   * @param userAddress - Address to remove from allowlist
   * @param packageId - Seal allowlist package ID
   * @param signAndExecuteTransaction - Function to execute tx
   */
  async removeUser(
    allowlistId: string,
    capId: string,
    userAddress: string,
    packageId: string,
    signAndExecuteTransaction: (args: {
      transaction: Transaction;
      chain: string;
    }) => Promise<any>
  ): Promise<AddUserResult> {
    console.log(`Removing ${userAddress} from allowlist ${allowlistId}`);

    const tx = new Transaction();

    tx.moveCall({
      target: `${packageId}::allowlist::remove`,
      arguments: [
        tx.object(allowlistId),       // Shared allowlist object
        tx.object(capId),              // Admin capability
        tx.pure.address(userAddress),  // User to remove
      ],
    });

    const result = await signAndExecuteTransaction({
      transaction: tx,
      chain: 'sui:testnet',
    });

    console.log('✅ User removed from allowlist');

    return {
      digest: result.digest,
      success: true,
    };
  }

  /**
   * Get allowlist namespace (prefix for policy IDs)
   * This is the allowlist object ID in bytes
   *
   * @param allowlistId - Allowlist object ID
   * @returns Hex string of allowlist ID bytes
   */
  getNamespace(allowlistId: string): string {
    // Remove 0x prefix if present
    const cleanId = allowlistId.startsWith('0x') ? allowlistId.slice(2) : allowlistId;
    return cleanId;
  }

  /**
   * Generate a policy ID with proper allowlist namespace
   * Format: [allowlist_id_bytes][random_nonce]
   *
   * @param allowlistId - Allowlist object ID
   * @returns Policy ID hex string (no 0x prefix)
   */
  generatePolicyId(allowlistId: string): string {
    // Get allowlist namespace (its object ID bytes)
    const namespace = this.getNamespace(allowlistId);

    // Generate random nonce (16 bytes = 128 bits)
    const nonce = crypto.getRandomValues(new Uint8Array(16));
    const nonceHex = toHex(nonce);

    // Combine: [allowlist_id][nonce]
    const policyId = namespace + nonceHex;

    console.log('Generated policy ID:', policyId);
    console.log('  Namespace (allowlist ID):', namespace);
    console.log('  Nonce:', nonceHex);

    return policyId;
  }

  /**
   * Check if an address is in the allowlist
   *
   * @param allowlistId - Allowlist object ID
   * @param userAddress - Address to check
   * @param suiClient - Sui client instance
   * @returns True if user is in allowlist
   */
  async isAuthorized(
    allowlistId: string,
    userAddress: string,
    suiClient: SuiClient
  ): Promise<boolean> {
    try {
      // Fetch the allowlist object
      const allowlistObj = await suiClient.getObject({
        id: allowlistId,
        options: { showContent: true },
      });

      if (!allowlistObj.data?.content || allowlistObj.data.content.dataType !== 'moveObject') {
        return false;
      }

      // Extract the list field
      const fields = allowlistObj.data.content.fields as any;
      const list = fields.list || [];

      // Check if user address is in the list
      return list.includes(userAddress);
    } catch (error) {
      console.error('Error checking authorization:', error);
      return false;
    }
  }

  /**
   * Get all addresses in the allowlist
   *
   * @param allowlistId - Allowlist object ID
   * @param suiClient - Sui client instance
   * @returns Array of authorized addresses
   */
  async getAllowlistMembers(
    allowlistId: string,
    suiClient: SuiClient
  ): Promise<string[]> {
    try {
      const allowlistObj = await suiClient.getObject({
        id: allowlistId,
        options: { showContent: true },
      });

      if (!allowlistObj.data?.content || allowlistObj.data.content.dataType !== 'moveObject') {
        return [];
      }

      const fields = allowlistObj.data.content.fields as any;
      return fields.list || [];
    } catch (error) {
      console.error('Error fetching allowlist members:', error);
      return [];
    }
  }
}

// Export singleton instance
export const allowlistService = new AllowlistService();
