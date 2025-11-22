'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import {
  ArrowLeft,
  Download,
  Shield,
  Hash,
  Database,
  Files,
  Calendar,
  CheckCircle,
  Clock,
  Lock,
  QrCode,
  CircleNotch,
  Warning
} from '@phosphor-icons/react';
import { formatAddress, formatHash } from '@/lib/utils';
import { useTruthMarket } from '@/hooks/useTruthMarket';
import { DatasetNFT } from '@/lib/types';
import { walrusService } from '@/lib/walrus-service';
import { DatasetDownload } from '@/components/dataset/DatasetDownload';
import { AccessManagement } from '@/components/dataset/AccessManagement';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { CONFIG } from '@/lib/constants';

export default function DatasetDetailPage() {
  const params = useParams();
  const nftId = params.id as string;
  const { getDatasetDetails } = useTruthMarket();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [dataset, setDataset] = useState<DatasetNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [capId, setCapId] = useState<string | null>(null);
  const [capLoading, setCapLoading] = useState(false);
  const [capDiscoveryError, setCapDiscoveryError] = useState<string | null>(null);

  // Fetch dataset details on mount
  useEffect(() => {
    const fetchDataset = async () => {
      setLoading(true);
      try {
        const data = await getDatasetDetails(nftId);
        setDataset(data);
      } catch (err) {
        console.error('Error fetching dataset:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dataset';
        setError(errorMessage);
        toast.error('Failed to load dataset');
      } finally {
        setLoading(false);
      }
    };

    if (nftId) {
      fetchDataset();
    }
  }, [nftId, getDatasetDetails]);

  // Cap discovery function (can be called for retry)
  const discoverCap = async () => {
    // Only discover if:
    // 1. Dataset is loaded
    // 2. Dataset has an allowlist
    // 3. User is connected and owns the dataset
    if (!dataset || !dataset.seal_allowlist_id || !currentAccount || currentAccount.address !== dataset.owner) {
      return;
    }

    setCapLoading(true);
    setCapDiscoveryError(null);
    setCapId(null); // Reset previous result

    try {
      // Query for Cap objects owned by the user
      const capStructType = `${CONFIG.SEAL_ALLOWLIST_PACKAGE_ID}::allowlist::Cap`;

      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: capStructType,
        },
        options: {
          showContent: true,
        },
      });

      // Find Cap that matches this dataset's allowlist
      let found = false;
      for (const obj of ownedObjects.data) {
        if (obj.data && 'content' in obj.data && obj.data.content) {
          const content = obj.data.content as {
            dataType: string;
            fields?: {
              allowlist_id?: string;
              [key: string]: unknown;
            };
          };
          if (content.dataType === 'moveObject' && content.fields) {
            // Check if this Cap's allowlist_id matches the dataset's seal_allowlist_id
            if (content.fields.allowlist_id === dataset.seal_allowlist_id) {
              setCapId(obj.data.objectId);
              console.log('✅ Found Cap ID:', obj.data.objectId);
              found = true;
              break;
            }
          }
        }
      }

      if (!found) {
        console.warn('⚠️ Cap not found for this dataset');
        // Not setting error here - this is normal if user transferred the Cap
      }
    } catch (err) {
      console.error('Failed to discover Cap:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setCapDiscoveryError(errorMessage);
      toast.error(`Failed to discover Cap: ${errorMessage}`);
    } finally {
      setCapLoading(false);
    }
  };

  // Discover Cap ID when user owns the dataset
  useEffect(() => {
    discoverCap();
  }, [dataset, currentAccount, suiClient]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
          <div className="container-fluid">
            <div className="flex items-center justify-center py-16">
              <CircleNotch weight="bold" size={48} className="animate-spin text-primary" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !dataset) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
          <div className="container-fluid">
            <div className="text-center py-16">
              <Warning weight="light" size={64} className="mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Dataset Not Found</h3>
              <p className="text-muted-foreground mb-6">
                {error || 'The requested dataset could not be found.'}
              </p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <ArrowLeft weight="regular" size={16} />
                Back to Explore
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const nft = dataset;
  const id = nft.id;
  const registered_at = nft.verification_timestamp;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
        <div className="container-fluid">
          {/* Back Button */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft weight="regular" size={20} />
            Back to Explore
          </Link>

          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-border p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">
                    {nft.name || 'Untitled Dataset'}
                  </h1>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100">
                    <CheckCircle weight="fill" size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">Verified</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground">
                  {nft.dataset_url || 'No description provided'}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Files weight="duotone" size={20} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground">Format</p>
                </div>
                <p className="text-lg font-bold">{nft.format || 'Unknown'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Database weight="duotone" size={20} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground">Size</p>
                </div>
                <p className="text-lg font-bold">
                  {walrusService.formatFileSize(nft.size || 0)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar weight="duotone" size={20} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground">Registered</p>
                </div>
                <p className="text-lg font-bold">
                  {new Date(registered_at).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock weight="duotone" size={20} className="text-primary" />
                  <p className="text-xs font-semibold text-muted-foreground">Time</p>
                </div>
                <p className="text-lg font-bold">
                  {new Date(registered_at).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowDownloadModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                <Download weight="regular" size={20} />
                Download & Decrypt
              </button>
              <Link
                href={`/verify?hash=${nft.original_hash}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-all"
              >
                <Shield weight="regular" size={20} />
                Verify Integrity
              </Link>
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border hover:bg-gray-50 transition-colors font-medium"
              >
                <QrCode weight="regular" size={20} />
                Share
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dataset Information */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Database weight="duotone" size={24} className="text-primary" />
                Dataset Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Dataset ID</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {id}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Original Hash (SHA-256)</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.original_hash || 'N/A'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hash of unencrypted file for integrity verification
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Metadata Hash</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.metadata_hash || 'N/A'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hash of dataset metadata for verification
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Owner</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.owner}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Registered By</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {formatAddress(nft.owner)}
                  </code>
                </div>
              </div>
            </div>

            {/* Storage & Encryption */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lock weight="duotone" size={24} className="text-purple-600" />
                Storage & Encryption
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Walrus Blob ID</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.walrus_blob_id || 'N/A'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Decentralized storage location on Walrus
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Seal Policy ID</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.seal_policy_id || 'N/A'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access control policy for encrypted dataset
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield weight="duotone" size={24} className="text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-purple-900 mb-1">End-to-End Encryption</p>
                      <p className="text-sm text-purple-800">
                        This dataset is encrypted with Seal before storage. Only authorized wallets
                        can decrypt and access the original data.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield weight="duotone" size={24} className="text-green-600" />
                Hardware Attestation
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Enclave ID</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {nft.enclave_id || 'N/A'}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trusted Execution Environment identifier
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">TEE Signature</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {formatHash(nft.tee_signature || '', 32)}
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cryptographic signature from Nautilus enclave
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Verification Timestamp</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block">
                    {nft.verification_timestamp
                      ? new Date(nft.verification_timestamp).toLocaleString()
                      : new Date(registered_at).toLocaleString()
                    }
                  </code>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle weight="duotone" size={24} className="text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-green-900 mb-1">Verified by Nautilus TEE</p>
                      <p className="text-sm text-green-800">
                        This dataset&apos;s metadata has been cryptographically verified by a trusted
                        execution environment running in an AWS Nitro Enclave.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Blockchain Record */}
            <div className="bg-white rounded-2xl shadow-lg border border-border p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Hash weight="duotone" size={24} className="text-orange-600" />
                Blockchain Record
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">NFT Object ID</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {id}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Registration Date</p>
                  <code className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg block">
                    {new Date(registered_at).toLocaleString()}
                  </code>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Database weight="duotone" size={24} className="text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-orange-900 mb-1">Immutable Proof</p>
                      <p className="text-sm text-orange-800">
                        This registration is permanently stored on the Sui blockchain.
                        The record cannot be modified or deleted.
                      </p>
                    </div>
                  </div>
                </div>
                <a
                  href={`https://testnet.suivision.xyz/object/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-100 text-orange-900 hover:bg-orange-200 transition-colors font-medium w-full justify-center"
                >
                  View on Sui Explorer
                  <ArrowLeft weight="regular" size={16} className="rotate-180" />
                </a>
              </div>
            </div>
          </div>

          {/* Access Management Section - Only for Dataset Owner */}
          {currentAccount &&
           dataset &&
           currentAccount.address === dataset.owner &&
           dataset.seal_allowlist_id && (
            <div className="mt-6">
              {capLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <CircleNotch weight="bold" size={32} className="animate-spin text-orange-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Discovering access control...</p>
                </div>
              ) : capId ? (
                <AccessManagement
                  allowlistId={dataset.seal_allowlist_id}
                  capId={capId}
                  ownerAddress={dataset.owner}
                />
              ) : capDiscoveryError ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Warning weight="fill" size={24} className="text-red-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-red-900 mb-1">Failed to Discover Admin Cap</p>
                      <p className="text-sm text-red-800 mb-2">
                        An error occurred while trying to find your Admin Cap:
                      </p>
                      <p className="text-xs text-red-700 font-mono bg-red-100 px-3 py-2 rounded border border-red-200">
                        {capDiscoveryError}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={discoverCap}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CircleNotch weight="regular" size={16} />
                    Retry Discovery
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Warning weight="duotone" size={24} className="text-orange-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-semibold text-orange-900 mb-1">Access Management Unavailable</p>
                      <p className="text-sm text-orange-800 mb-2">
                        Unable to find the Admin Cap for this dataset. This could mean:
                      </p>
                      <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                        <li>You transferred the Cap to another wallet</li>
                        <li>The Cap is owned by a different account</li>
                        <li>The Cap ID was not saved during registration</li>
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={discoverCap}
                    className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <CircleNotch weight="regular" size={16} />
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mt-6">
            <div className="flex items-start gap-4">
              <Shield weight="duotone" size={32} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">How SealTrust Protects Your Data</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle weight="fill" size={16} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Client-Side Encryption:</strong> Your data is encrypted in your browser before upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle weight="fill" size={16} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Decentralized Storage:</strong> Encrypted data is stored across Walrus network nodes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle weight="fill" size={16} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Hardware Attestation:</strong> Metadata verified by tamper-proof AWS Nitro Enclave</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle weight="fill" size={16} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Blockchain Immutability:</strong> Registration proof permanently stored on Sui</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle weight="fill" size={16} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Access Control:</strong> Only authorized wallets can decrypt the dataset</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Download Modal */}
      {showDownloadModal && (
        <DatasetDownload
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          datasetName={nft.name || 'dataset'}
          walrusBlobId={nft.walrus_blob_id || ''}
          sealPolicyId={nft.seal_policy_id || ''}
          sealAllowlistId={nft.seal_allowlist_id || null}
          originalHash={nft.original_hash || ''}
          format={nft.format || 'unknown'}
        />
      )}
    </>
  );
}
