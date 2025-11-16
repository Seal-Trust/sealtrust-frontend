"use client";

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { X, Plus, Trash2, Users, Shield, AlertCircle } from 'lucide-react';
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
          <p className="text-xs text-gray-500 mt-2">
            Enter the Sui address of the user you want to grant access to
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
