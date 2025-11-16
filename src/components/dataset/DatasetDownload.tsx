'use client';

import { useState } from 'react';
import { Download, CheckCircle, X, Warning } from '@phosphor-icons/react';
import { useCurrentAccount, useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { toast } from 'sonner';
import { sealService } from '@/lib/seal-service';
import { walrusService } from '@/lib/walrus-service';
import { CONFIG } from '@/lib/constants';

interface DatasetDownloadProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  walrusBlobId: string;
  sealPolicyId: string;
  sealAllowlistId: string | null;  // Can be null for old datasets
  originalHash: string;
  format: string;
}

export function DatasetDownload({
  isOpen,
  onClose,
  datasetName,
  walrusBlobId,
  sealPolicyId,
  sealAllowlistId,
  originalHash,
  format,
}: DatasetDownloadProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

  const [step, setStep] = useState<'idle' | 'downloading' | 'decrypting' | 'verifying' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!currentAccount) {
      toast.error('Please connect your wallet to download');
      return;
    }

    if (!sealAllowlistId) {
      toast.error('This dataset does not have an allowlist configured. Please contact the dataset owner.');
      return;
    }

    try {
      // Step 1: Download encrypted blob from Walrus
      setStep('downloading');
      setProgress('Downloading encrypted blob from Walrus...');
      const encryptedArrayBuffer = await walrusService.downloadFromWalrus(walrusBlobId);
      console.log('✅ Downloaded encrypted blob:', encryptedArrayBuffer.byteLength, 'bytes');

      // Step 2: Decrypt with Seal (handles session key + approval tx automatically)
      setStep('decrypting');
      setProgress('Decrypting with Seal (building approval transaction)...');
      const decrypted = await sealService.downloadAndDecryptDataset(
        encryptedArrayBuffer,
        sealPolicyId,
        sealAllowlistId,
        CONFIG.SEAL_PACKAGE_ID,
        CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
        currentAccount.address,
        suiClient,
        signPersonalMessage
      );
      console.log('✅ Decrypted:', decrypted.byteLength, 'bytes');

      // Step 3: Verify integrity
      setStep('verifying');
      setProgress('Verifying data integrity...');
      const isValid = await sealService.verifyIntegrity(
        decrypted,
        originalHash
      );

      if (!isValid) {
        throw new Error('Integrity check failed! Hash mismatch after decryption.');
      }
      console.log('✅ Integrity verified: hash matches');

      // Step 4: Success - ready for download
      const blob = new Blob([decrypted], { type: getContentType(format) });
      setDecryptedBlob(blob);
      setStep('complete');
      setProgress('');
      toast.success('Dataset decrypted and verified! 🎉');

    } catch (err) {
      console.error('Download/decrypt failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download dataset';
      setError(errorMessage);
      setStep('error');
      setProgress('');
      toast.error(errorMessage);
    }
  };

  const handleDownloadFile = () => {
    if (!decryptedBlob) return;

    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = datasetName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Download started!');
  };

  const getContentType = (fmt: string): string => {
    const typeMap: Record<string, string> = {
      'CSV': 'text/csv',
      'JSON': 'application/json',
      'Parquet': 'application/octet-stream',
      'AVRO': 'application/octet-stream',
    };
    return typeMap[fmt] || 'application/octet-stream';
  };

  const isProcessing = step === 'downloading' || step === 'decrypting' || step === 'verifying';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X weight="regular" size={24} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            step === 'complete' ? 'bg-green-100' :
            step === 'error' ? 'bg-red-100' :
            'bg-orange-100'
          }`}>
            {step === 'complete' ? (
              <CheckCircle weight="fill" size={40} className="text-green-600" />
            ) : step === 'error' ? (
              <Warning weight="fill" size={40} className="text-red-600" />
            ) : (
              <Download weight="duotone" size={40} className="text-primary" />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            {step === 'complete' ? 'Ready to Download' :
             step === 'error' ? 'Download Failed' :
             'Download Dataset'}
          </h2>

          <p className="text-muted-foreground">
            {step === 'idle' && 'Download and decrypt this dataset with Seal access control'}
            {step === 'complete' && 'Dataset decrypted and verified successfully'}
            {step === 'error' && 'Failed to download or decrypt dataset'}
            {isProcessing && progress}
          </p>

          {/* Dataset Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Dataset Name</p>
              <p className="text-sm font-mono break-all">{datasetName}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Format</p>
              <p className="text-sm">{format}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Walrus Blob ID</p>
              <p className="text-sm font-mono truncate">{walrusBlobId}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Seal Policy ID</p>
              <p className="text-sm font-mono truncate">{sealPolicyId}</p>
            </div>
          </div>

          {/* Error Message */}
          {step === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          {/* Progress Messages */}
          {step === 'downloading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">Downloading from Walrus...</p>
            </div>
          )}

          {step === 'decrypting' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-900">Decrypting with Seal...</p>
            </div>
          )}

          {step === 'verifying' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-900">Verifying integrity...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {step === 'idle' && (
              <button
                onClick={handleDownload}
                disabled={!currentAccount}
                className="flex-1 px-4 py-2 rounded-lg gradient-primary text-white hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Download
              </button>
            )}

            {step === 'complete' && (
              <button
                onClick={handleDownloadFile}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white hover:shadow-lg transition-all font-medium"
              >
                <Download weight="regular" size={16} />
                Download File
              </button>
            )}

            {step === 'error' && (
              <button
                onClick={() => {
                  setStep('idle');
                  setError('');
                  setProgress('');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                Try Again
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors font-medium"
            >
              {step === 'complete' ? 'Done' : 'Cancel'}
            </button>
          </div>

          {/* Wallet Connection Notice */}
          {!currentAccount && step === 'idle' && (
            <p className="text-xs text-muted-foreground">
              Connect your wallet to download and decrypt datasets
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
