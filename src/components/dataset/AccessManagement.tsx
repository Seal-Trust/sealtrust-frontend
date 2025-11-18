"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { X, Plus, Trash2, Users, Shield, AlertCircle, ListPlus } from 'lucide-react';
import { allowlistService } from '@/lib/allowlist-service';
import { CONFIG } from '@/lib/constants';

interface AccessManagementProps {
  allowlistId: string;
  capId: string;
  ownerAddress: string;
}

export function AccessManagement({
  allowlistId,
  capId,
  ownerAddress,
}: AccessManagementProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [members, setMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [newMemberAddress, setNewMemberAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Batch add state
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchAddProgress, setBatchAddProgress] = useState({ current: 0, total: 0 });

  // Load current members
  const loadMembers = async () => {
    try {
      setLoading(true);
      const memberList = await allowlistService.getAllowlistMembers(
        allowlistId,
        suiClient
      );
      setMembers(memberList);
    } catch (error) {
      console.error('Failed to load members:', error);
      toast.error('Failed to load allowlist members');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMembers();
  }, [allowlistId]);

  // Check if current user is owner
  const isOwner = currentAccount?.address === ownerAddress;

  // Add member
  const handleAddMember = async () => {
    if (!newMemberAddress.trim()) {
      toast.error('Please enter a valid address');
      return;
    }

    // Basic address validation
    if (!newMemberAddress.startsWith('0x') || newMemberAddress.length !== 66) {
      toast.error('Invalid Sui address format (must be 0x... with 64 hex characters)');
      return;
    }

    // Check if already in allowlist
    if (members.includes(newMemberAddress)) {
      toast.error('This address is already in the allowlist');
      return;
    }

    try {
      setAdding(true);

      await allowlistService.addUser(
        allowlistId,
        capId,
        newMemberAddress,
        CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
        signAndExecuteTransaction
      );

      toast.success('User added to allowlist successfully');
      setNewMemberAddress('');
      setShowAddForm(false);

      // Reload members
      await loadMembers();
    } catch (error) {
      console.error('Failed to add member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member';
      toast.error(errorMessage);
    } finally {
      setAdding(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (address: string) => {
    // Prevent owner from removing themselves
    if (address === ownerAddress) {
      toast.error('You cannot remove yourself as the dataset owner from the allowlist');
      return;
    }

    if (!confirm(`Remove ${address.slice(0, 10)}...${address.slice(-8)} from allowlist?`)) {
      return;
    }

    try {
      setRemoving(address);

      await allowlistService.removeUser(
        allowlistId,
        capId,
        address,
        CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
        signAndExecuteTransaction
      );

      toast.success('User removed from allowlist');

      // Reload members
      await loadMembers();
    } catch (error) {
      console.error('Failed to remove member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      toast.error(errorMessage);
    } finally {
      setRemoving(null);
    }
  };

  // Parse batch input into addresses
  const parseBatchInput = (input: string): string[] => {
    // Split by comma, newline, or space
    return input
      .split(/[\n,\s]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
  };

  // Validate batch addresses
  const validateBatchAddresses = (addresses: string[]): { valid: string[], invalid: string[], duplicates: string[], existing: string[] } => {
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    const existing: string[] = [];
    const seen = new Set<string>();

    for (const address of addresses) {
      // Check format
      if (!address.startsWith('0x') || address.length !== 66) {
        invalid.push(address);
        continue;
      }

      // Check duplicates in input
      if (seen.has(address)) {
        duplicates.push(address);
        continue;
      }

      // Check if already in allowlist
      if (members.includes(address)) {
        existing.push(address);
        continue;
      }

      seen.add(address);
      valid.push(address);
    }

    return { valid, invalid, duplicates, existing };
  };

  // Handle batch add
  const handleBatchAdd = async () => {
    if (!batchInput.trim()) {
      toast.error('Please enter at least one address');
      return;
    }

    const addresses = parseBatchInput(batchInput);
    const { valid, invalid, duplicates, existing } = validateBatchAddresses(addresses);

    // Show validation results
    if (invalid.length > 0) {
      toast.error(`${invalid.length} invalid address(es) found. Please check the format.`);
      return;
    }

    if (valid.length === 0) {
      toast.error('No valid addresses to add');
      return;
    }

    // Show summary
    const messages: string[] = [];
    if (valid.length > 0) messages.push(`${valid.length} will be added`);
    if (duplicates.length > 0) messages.push(`${duplicates.length} duplicate(s) skipped`);
    if (existing.length > 0) messages.push(`${existing.length} already in allowlist`);

    if (!confirm(`Add ${valid.length} member(s) to allowlist?\n\n${messages.join('\n')}`)) {
      return;
    }

    try {
      setAdding(true);
      setBatchAddProgress({ current: 0, total: valid.length });

      for (let i = 0; i < valid.length; i++) {
        const address = valid[i];
        setBatchAddProgress({ current: i + 1, total: valid.length });

        await allowlistService.addUser(
          allowlistId,
          capId,
          address,
          CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
          signAndExecuteTransaction
        );

        console.log(`✅ Added member ${i + 1}/${valid.length}:`, address);
      }

      toast.success(`Successfully added ${valid.length} member(s) to allowlist`);
      setBatchInput('');
      setBatchMode(false);
      setShowAddForm(false);

      // Reload members
      await loadMembers();
    } catch (error) {
      console.error('Failed to add members:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add members';
      toast.error(errorMessage);
    } finally {
      setAdding(false);
      setBatchAddProgress({ current: 0, total: 0 });
    }
  };

  if (!isOwner) {
    return null; // Don't render for non-owners
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 px-6 py-4 border-b border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Access Management</h3>
              <p className="text-xs text-gray-600">Manage who can download this dataset</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Add Member Form */}
      {showAddForm && (
        <div className="px-6 py-4 bg-orange-50/30 border-b border-orange-100">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setBatchMode(false)}
              disabled={adding}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !batchMode
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Single
            </button>
            <button
              onClick={() => setBatchMode(true)}
              disabled={adding}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                batchMode
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              Batch
            </button>
          </div>

          {/* Single Mode */}
          {!batchMode && (
            <div className="flex gap-3">
              <input
                type="text"
                value={newMemberAddress}
                onChange={(e) => setNewMemberAddress(e.target.value)}
                placeholder="0x... (Sui address)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={adding}
              />
              <button
                onClick={handleAddMember}
                disabled={adding || !newMemberAddress.trim()}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewMemberAddress('');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Batch Mode */}
          {batchMode && (
            <div className="space-y-3">
              <textarea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder="Paste multiple addresses (separated by comma, newline, or space)&#10;Example:&#10;0x1234...&#10;0x5678...&#10;0x9abc..."
                rows={6}
                disabled={adding}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />

              {/* Progress Indicator */}
              {adding && batchAddProgress.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Adding members...</span>
                    <span className="font-medium">
                      {batchAddProgress.current} / {batchAddProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(batchAddProgress.current / batchAddProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBatchAdd}
                  disabled={adding || !batchInput.trim()}
                  className="flex-1 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? 'Adding...' : 'Add All'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setBatchInput('');
                  }}
                  disabled={adding}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {batchMode
              ? 'Paste multiple addresses separated by comma, newline, or space'
              : 'Enter the Sui address of the user you want to grant access to'}
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="px-6 py-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 mt-2">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No members in allowlist yet</p>
            <p className="text-xs text-gray-400 mt-1">Add users to grant them access to this dataset</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-medium text-gray-600">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            {members.map((address) => (
              <div
                key={address}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all"
              >
                <div className="flex-1">
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {address}
                  </p>
                  {address === ownerAddress && (
                    <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded mt-1">
                      Owner
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveMember(address)}
                  disabled={removing === address || address === ownerAddress}
                  className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title={address === ownerAddress ? "Owner cannot be removed" : "Remove member"}
                >
                  {removing === address ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Only addresses in this allowlist can download and decrypt the dataset. Changes take effect immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
