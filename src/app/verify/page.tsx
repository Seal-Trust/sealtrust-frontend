'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { VerificationResultPanel } from '@/components/verify/VerificationResultPanel';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import {
  ArrowLeft,
  Upload,
  CircleNotch,
  MagnifyingGlass,
  Globe,
  Hash,
} from '@phosphor-icons/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useSealTrust } from '@/hooks/useSealTrust';
import { computeFileHash, computeUrlHash, formatHash } from '@/lib/utils/crypto';
import { toast } from 'sonner';
import { DatasetNFT } from '@/lib/types';

export default function VerifyPage() {
  const account = useCurrentAccount();
  const [verificationMethod, setVerificationMethod] = useState<'file' | 'url' | 'hash'>('file');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualHash, setManualHash] = useState('');
  const [computedHash, setComputedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);

  const { verifyDataset, verifying } = useSealTrust();
  const [verificationResult, setVerificationResult] = useState<{
    found: boolean;
    dataset: DatasetNFT | null;
    registrant?: string;
    tx_digest?: string;
  } | null>(null);

  // Debug state changes (AFTER state declaration)
  console.log('📄 VerifyPage render:', {
    computedHash: computedHash ? computedHash.substring(0, 16) + '...' : 'none',
    verifying,
    hasResult: !!verificationResult
  });

  // Handle URL params for easy sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    if (hash) {
      setComputedHash(hash);
      setVerificationMethod('hash');
      setManualHash(hash);
    }
  }, []);

  // AUTO-VERIFICATION: Trigger verification when hash is computed
  useEffect(() => {
    if (
      computedHash &&
      computedHash.length === 64 &&
      !verificationResult &&
      !verifying &&
      !isHashing
    ) {
      console.log('🚀 Auto-triggering verification for hash:', computedHash.substring(0, 16) + '...');
      handleVerify(computedHash);
    }
  }, [computedHash]); // Only trigger when computedHash changes

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setComputedHash('');
      setVerificationResult(null);
    }
  };

  const handleHashComputation = async () => {
    console.log('🔨 handleHashComputation called, method:', verificationMethod);
    setIsHashing(true);
    setVerificationResult(null);

    try {
      let hashResult;

      if (verificationMethod === 'file') {
        if (!selectedFile) {
          toast.error('Please select a file');
          setIsHashing(false);
          return;
        }
        console.log('📁 Computing hash for file:', selectedFile.name);
        hashResult = await computeFileHash(selectedFile);
      } else {
        if (!fileUrl) {
          toast.error('Please enter a valid URL');
          setIsHashing(false);
          return;
        }
        console.log('🌐 Computing hash for URL:', fileUrl);
        hashResult = await computeUrlHash(fileUrl);
      }

      console.log('✅ Hash computed:', hashResult.hash.substring(0, 16) + '...');
      setComputedHash(hashResult.hash);
      toast.success(`Hash computed: ${formatHash(hashResult.hash, 16)}`);
    } catch (error) {
      console.error('💥 Hash computation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to compute hash');
      setComputedHash('');
    } finally {
      setIsHashing(false);
    }
  };

  const handleVerify = async (hashToVerify?: string) => {
    const hash = hashToVerify || computedHash;
    console.log('🔍 handleVerify called with hash:', hash ? `${hash.substring(0, 16)}...` : 'none');

    if (!hash) {
      toast.error('Please compute hash first');
      return;
    }

    const toastId = toast.loading('Searching blockchain...');

    try {
      console.log('📡 Calling verifyDataset...');
      const result = await verifyDataset(hash);
      console.log('✅ verifyDataset result:', { found: result.found, hasDataset: !!result.dataset });

      setVerificationResult(result);

      if (result.found) {
        console.log('🎉 Dataset found! Details:', {
          name: result.dataset?.name,
          timestamp: result.dataset?.verification_timestamp,
          owner: result.registrant
        });
        toast.success('Dataset found in registry!', { id: toastId });
      } else {
        console.log('❌ Dataset not found in registry');
        toast.error('Dataset not found in registry', { id: toastId });
      }
    } catch (error) {
      console.error('💥 Verification error:', error);
      toast.error(error instanceof Error ? error.message : 'Network error', { id: toastId });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-white via-orange-50/20 to-white pt-24 pb-16">
        <div className="container-fluid">
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft weight="regular" size={20} />
            <span>Back to Home</span>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Content - Verification Form */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  Verify Dataset
                </h1>
                <p className="text-xl text-muted-foreground">
                  Check if a dataset has been registered on the blockchain and verify its integrity.
                </p>
              </div>

              {/* Method Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Verification Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setVerificationMethod('file');
                      setFileUrl('');
                      setManualHash('');
                      setComputedHash('');
                      setVerificationResult(null);
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      verificationMethod === 'file'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <Upload weight="regular" size={24} className="text-primary" />
                    <span className="text-sm font-medium">Upload File</span>
                  </button>
                  <button
                    onClick={() => {
                      setVerificationMethod('url');
                      setSelectedFile(null);
                      setManualHash('');
                      setComputedHash('');
                      setVerificationResult(null);
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      verificationMethod === 'url'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <Globe weight="regular" size={24} className="text-primary" />
                    <span className="text-sm font-medium">Enter URL</span>
                  </button>
                  <button
                    onClick={() => {
                      setVerificationMethod('hash');
                      setSelectedFile(null);
                      setFileUrl('');
                      setComputedHash('');
                      setVerificationResult(null);
                    }}
                    className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                      verificationMethod === 'hash'
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <Hash weight="regular" size={24} className="text-primary" />
                    <span className="text-sm font-medium">Enter Hash</span>
                  </button>
                </div>
              </div>

              {/* Input based on method */}
              <div className="space-y-4">
                {verificationMethod === 'file' ? (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Dataset File
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                  </div>
                ) : verificationMethod === 'url' ? (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Dataset URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/dataset.csv"
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Dataset Hash (SHA-256)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., abc123def456789... (64 characters)"
                      value={manualHash}
                      onChange={(e) => {
                        const hash = e.target.value.toLowerCase().replace(/[^0-9a-f]/g, '');
                        setManualHash(hash);
                        // Set computed hash if valid length
                        if (hash.length === 64) {
                          setComputedHash(hash);
                        } else {
                          setComputedHash('');
                          setVerificationResult(null);
                        }
                      }}
                      maxLength={64}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the SHA-256 hash (64 hex characters). {manualHash.length}/64
                      {manualHash.length === 64 && ' ✓'}
                    </p>
                  </div>
                )}

                {/* Compute Hash Button (only for file/URL methods) */}
                {verificationMethod !== 'hash' && (
                  <button
                    onClick={handleHashComputation}
                    disabled={isHashing || (!selectedFile && !fileUrl)}
                    className="w-full px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {isHashing ? (
                      <>
                        <CircleNotch weight="regular" size={20} className="animate-spin" />
                        <span>Computing Hash...</span>
                      </>
                    ) : (
                      <>
                        <Hash weight="regular" size={20} />
                        <span>Compute Hash & Verify</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right - Verification Result Panel */}
            <div className="lg:sticky lg:top-24">
              <VerificationResultPanel
                computedHash={computedHash}
                verifying={verifying}
                isHashing={isHashing}
                verificationResult={verificationResult}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}