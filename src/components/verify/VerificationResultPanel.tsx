'use client';

import { QrCode, Files, CircleNotch, Warning, CheckCircle } from '@phosphor-icons/react';
import { DatasetQR } from '@/components/dataset/DatasetQR';
import { DatasetNFT } from '@/lib/types';

interface VerificationResultPanelProps {
  computedHash: string;
  verifying: boolean;
  isHashing?: boolean;
  verificationResult: {
    found: boolean;
    dataset: DatasetNFT | null;
    registrant?: string;
    tx_digest?: string;
  } | null;
}

export function VerificationResultPanel({
  computedHash,
  verifying,
  isHashing = false,
  verificationResult,
}: VerificationResultPanelProps) {
  // Debug logging
  console.log('🎨 VerificationResultPanel render:', {
    hasHash: !!computedHash,
    verifying,
    isHashing,
    hasResult: !!verificationResult,
    found: verificationResult?.found
  });

  // PRIORITY 0: Hashing - HIGHEST PRIORITY (check first!)
  if (isHashing) {
    console.log('⏳ Showing HASHING state');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
        <CircleNotch weight="bold" size={64} className="mx-auto mb-4 text-orange-500 animate-spin" />
        <h3 className="text-xl font-semibold mb-2">Computing Hash...</h3>
        <p className="text-muted-foreground">
          Generating SHA-256 fingerprint of your dataset
        </p>
      </div>
    );
  }

  // PRIORITY 1: Verifying - SECOND HIGHEST PRIORITY
  if (verifying) {
    console.log('⏳ Showing LOADING state');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
        <CircleNotch weight="bold" size={64} className="mx-auto mb-4 text-primary animate-spin" />
        <h3 className="text-xl font-semibold mb-2">Searching Blockchain...</h3>
        <p className="text-muted-foreground">
          Looking for dataset registration on Sui network
        </p>
        {computedHash && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs font-mono text-blue-800 break-all">
              {computedHash}
            </p>
          </div>
        )}
      </div>
    );
  }

  // PRIORITY 2: Initial - No hash computed yet
  if (!computedHash && !verificationResult) {
    console.log('📭 Showing INITIAL state');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
        <Files weight="light" size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">No Dataset Verified</h3>
        <p className="text-muted-foreground">
          Enter a hash, upload a file, or provide a URL to verify a dataset
        </p>
      </div>
    );
  }

  // PRIORITY 3: Verified & Found - Show QR Code
  if (verificationResult?.found && computedHash) {
    console.log('✅ Showing FOUND state');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle weight="fill" size={24} className="text-green-600" />
          <h2 className="text-2xl font-bold">Dataset Verified!</h2>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-900 font-medium">
            ✓ This dataset is registered on the blockchain
          </p>
        </div>

        <DatasetQR
          hash={computedHash}
          datasetName={verificationResult.dataset?.name}
          timestamp={verificationResult.dataset?.verification_timestamp}
        />

        <div className="mt-6 pt-6 border-t border-border space-y-2 text-sm">
          {verificationResult.dataset?.name && (
            <div>
              <span className="font-medium text-muted-foreground">Name: </span>
              <span className="text-foreground">{verificationResult.dataset.name}</span>
            </div>
          )}
          {verificationResult.dataset?.verification_timestamp && (
            <div>
              <span className="font-medium text-muted-foreground">Registered: </span>
              <span className="text-foreground">
                {new Date(verificationResult.dataset.verification_timestamp).toLocaleDateString()}
              </span>
            </div>
          )}
          {verificationResult.registrant && (
            <div>
              <span className="font-medium text-muted-foreground">Owner: </span>
              <code className="text-xs text-foreground">
                {verificationResult.registrant.substring(0, 12)}...
              </code>
            </div>
          )}
          {verificationResult.tx_digest && (
            <div className="pt-2">
              <a
                href={`https://suiscan.xyz/testnet/tx/${verificationResult.tx_digest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                View on Explorer →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  // PRIORITY 4: Verified but NOT Found - Show not registered message
  if (verificationResult && !verificationResult.found && computedHash) {
    console.log('❌ Showing NOT FOUND state');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
        <Warning weight="light" size={64} className="mx-auto mb-4 text-red-500" />
        <h3 className="text-xl font-semibold mb-2 text-red-900">Dataset Not Registered</h3>
        <p className="text-muted-foreground mb-4">
          This dataset hash was not found on the blockchain
        </p>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-mono text-red-800 break-all">
            {computedHash}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Want to register this dataset?
          </p>
          <a
            href="/register"
            className="inline-block px-6 py-2 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all"
          >
            Register Dataset →
          </a>
        </div>
      </div>
    );
  }

  // PRIORITY 5: Hash computed but not verified yet (shouldn't happen with auto-verify)
  if (computedHash && !verificationResult) {
    console.log('🔍 Showing READY TO VERIFY state (transitioning...)');
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-border p-12 text-center">
        <CircleNotch weight="bold" size={64} className="mx-auto mb-4 text-orange-500 animate-spin" />
        <h3 className="text-xl font-semibold mb-2">Preparing Verification...</h3>
        <p className="text-muted-foreground mb-4">
          Hash computed, starting blockchain search
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs font-mono text-orange-800 break-all">
            {computedHash}
          </p>
        </div>
      </div>
    );
  }

  // Fallback
  console.log('⚠️ Showing FALLBACK (should not happen)');
  return null;
}
