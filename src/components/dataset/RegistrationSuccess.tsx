'use client';

import { CheckCircle, X, ExternalLink, Copy } from '@phosphor-icons/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface RegistrationSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  datasetUrl: string;
  size: string;
  txHash?: string;
}

export function RegistrationSuccess({
  isOpen,
  onClose,
  datasetUrl,
  size,
  txHash,
}: RegistrationSuccessProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyTxHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      toast.success('Transaction hash copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

        {/* Success Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle weight="fill" size={40} className="text-green-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">
            Dataset Registered!
          </h2>

          <p className="text-muted-foreground">
            Your dataset has been successfully registered on the Sui blockchain.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-left">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Dataset URL</p>
              <p className="text-sm font-mono break-all">{datasetUrl}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Size</p>
              <p className="text-sm">{size} MB</p>
            </div>

            {txHash && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono truncate flex-1">{txHash}</p>
                  <button
                    onClick={copyTxHash}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle weight="fill" size={16} />
                    ) : (
                      <Copy weight="regular" size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {txHash && (
              <a
                href={`https://suiscan.xyz/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
              >
                <ExternalLink weight="regular" size={16} />
                View on Explorer
              </a>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}