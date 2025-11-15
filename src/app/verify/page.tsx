'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { DatasetQR } from '@/components/dataset/DatasetQR';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import {
  ArrowLeft,
  QrCode,
  Upload,
  Copy,
  CheckCircle,
  CircleNotch,
  Warning,
  MagnifyingGlass,
  Globe,
  Hash,
  Files
} from '@phosphor-icons/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useTruthMarket } from '@/hooks/useTruthMarket';
import { computeFileHash, computeUrlHash, formatHash } from '@/lib/utils/crypto';
import { toast } from 'sonner';

export default function VerifyPage() {
  const account = useCurrentAccount();
  const [verificationMethod, setVerificationMethod] = useState<'file' | 'url'>('file');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [copied, setCopied] = useState(false);

  const { verifyDataset, verifying } = useTruthMarket();
  const [verificationResult, setVerificationResult] = useState<{
    found: boolean;
    dataset: any;
    registrant?: string;
    tx_digest?: string;
  } | null>(null);

  // Handle URL params for easy sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = params.get('hash');
    if (hash) {
      setComputedHash(hash);
      // Auto-verify if hash is provided
      handleVerify(hash);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setComputedHash('');
      setVerificationResult(null);
    }
  };

  const handleHashComputation = async () => {
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
        hashResult = await computeFileHash(selectedFile);
      } else {
        if (!fileUrl) {
          toast.error('Please enter a valid URL');
          setIsHashing(false);
          return;
        }
        hashResult = await computeUrlHash(fileUrl);
      }

      setComputedHash(hashResult.hash);
      toast.success(`Hash computed: ${formatHash(hashResult.hash, 16)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to compute hash');
      setComputedHash('');
    } finally {
      setIsHashing(false);
    }
  };

  const handleVerify = async (hashToVerify?: string) => {
    const hash = hashToVerify || computedHash;
    if (!hash) {
      toast.error('Please compute hash first');
      return;
    }

    const toastId = toast.loading('Searching blockchain...');

    try {
      const result = await verifyDataset(hash);
      setVerificationResult(result);

      if (result.found) {
        toast.success('Dataset found in registry!', { id: toastId });
      } else {
        toast.error('Dataset not found in registry', { id: toastId });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Network error', { id: toastId });
    }
  };

  const copyHash = () => {
    if (computedHash) {
      navigator.clipboard.writeText(computedHash);
      setCopied(true);
      toast.success('Hash copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
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
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setVerificationMethod('file');
                      setFileUrl('');
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
                ) : (
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
                )}

                {/* Compute Hash Button */}
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
                      <span>Compute Hash</span>
                    </>
                  )}
                </button>

                {/* Computed Hash Display */}
                {computedHash && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-orange-900">Computed Hash</span>
                      <button
                        onClick={copyHash}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-white border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        {copied ? (
                          <>
                            <CheckCircle weight="fill" size={14} className="text-success" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy weight="regular" size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-xs font-mono text-orange-800 break-all">
                      {computedHash}
                    </code>
                  </div>
                )}

                {/* Verify Button */}
                {computedHash && (
                  <button
                    onClick={() => handleVerify()}
                    disabled={verifying}
                    className="w-full px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifying ? (
                      <>
                        <CircleNotch weight="regular" size={20} className="animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <MagnifyingGlass weight="regular" size={20} />
                        <span>Verify on Blockchain</span>
                      </>
                    )}
                  </button>
                )}

                {/* Verification Result */}
                {verificationResult && (
                  <div className={`rounded-xl p-6 ${
                    verificationResult.found
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {verificationResult.found ? (
                        <CheckCircle weight="fill" size={24} className="text-green-600 mt-1" />
                      ) : (
                        <Warning weight="fill" size={24} className="text-red-600 mt-1" />
                      )}
                      <div className="flex-1 space-y-2">
                        <h3 className={`font-semibold ${
                          verificationResult.found ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {verificationResult.found ? 'Dataset Verified!' : 'Dataset Not Found'}
                        </h3>
                        <p className={`text-sm ${
                          verificationResult.found ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {verificationResult.found
                            ? 'This dataset has been registered and verified on the blockchain.'
                            : 'This dataset has not been registered on the blockchain.'}
                        </p>

                        {verificationResult.found && verificationResult.dataset && (
                          <div className="mt-4 space-y-2 text-sm">
                            {verificationResult.dataset.timestamp && (
                              <div>
                                <span className="font-medium">Registered: </span>
                                {new Date(verificationResult.dataset.timestamp).toLocaleDateString()}
                              </div>
                            )}
                            {verificationResult.registrant && (
                              <div>
                                <span className="font-medium">By: </span>
                                <code className="text-xs">{verificationResult.registrant.slice(0, 12)}...</code>
                              </div>
                            )}
                            {verificationResult.tx_digest && (
                              <a
                                href={`https://suiscan.xyz/testnet/tx/${verificationResult.tx_digest}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
                              >
                                View Transaction →
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right QR Code Section */}
            <div className="lg:sticky lg:top-24">
              {computedHash && verificationResult?.found ? (
                <div className="bg-white rounded-2xl shadow-xl border border-border p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <QrCode weight="regular" size={24} className="text-primary" />
                    <h2 className="text-2xl font-bold">Verification QR Code</h2>
                  </div>

                  <DatasetQR
                    hash={computedHash}
                    datasetName={verificationResult.dataset?.name}
                    timestamp={verificationResult.dataset?.timestamp}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
                  <Files weight="light" size={64} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Verified Dataset</h3>
                  <p className="text-muted-foreground">
                    Compute a hash and verify it to generate a QR code
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}