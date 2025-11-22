"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Share2, Download, Copy, Check, ExternalLink } from "lucide-react";
import { toPng } from "html-to-image";
import QRCode from "react-qr-code";

interface DatasetReceiptProps {
  datasetUrl: string;
  hash: string;
  blobId: string;
  policyId: string;
  timestamp: number;
  txId: string;
  nftId: string;
  registrant: string;
  allowlistId?: string;
  allowlistCapId?: string;
  format?: string;
  schemaVersion?: string;
  onClose?: () => void;
}

export function DatasetReceipt({
  datasetUrl,
  hash,
  blobId,
  policyId,
  timestamp,
  txId,
  nftId,
  registrant,
  allowlistId,
  allowlistCapId,
  format = "CSV",
  schemaVersion = "v1.0",
  onClose
}: DatasetReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [capIdSaved, setCapIdSaved] = useState(false);

  const receiptUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?hash=${hash}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(receiptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById('receipt-content');
      if (!element) return;

      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `sealtrust-receipt-${hash.slice(0, 12)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download receipt:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SealTrust Dataset Receipt',
          text: `Verified dataset registration on SealTrust`,
          url: receiptUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const content = (
    <div className="w-full space-y-4">
      {/* Receipt Card */}
      <div
        id="receipt-content"
        className="relative overflow-hidden rounded-lg bg-white border border-gray-200 p-8"
      >
        {/* Glassmorphism effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="SealTrust"
              width={40}
              height={40}
              className="filter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            />
            <div>
              <h3 className="text-xl font-medium bg-gradient-to-b from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
                SEAL TRUST
              </h3>
              <p className="text-xs text-gray-500">Cryptographic Dataset Registry</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Certificate of Registration</p>
            <p className="text-xs text-gray-400 font-mono">#{nftId.slice(0, 12)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Dataset Info */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Dataset URL</p>
            <p className="text-sm text-gray-900 font-medium break-all leading-relaxed">
              {datasetUrl}
            </p>
          </div>

          {/* Hash */}
          <div>
            <p className="text-xs text-gray-500 mb-2">SHA-256 Hash</p>
            <p className="text-xs text-gray-600 font-mono break-all leading-relaxed">
              {hash}
            </p>
          </div>

          {/* Storage IDs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Walrus Blob ID</p>
              <p className="text-xs text-gray-600 font-mono truncate">{blobId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Seal Policy ID</p>
              <p className="text-xs text-gray-600 font-mono truncate">{policyId}</p>
            </div>
          </div>

          {/* Access Control IDs - CRITICAL SECTION */}
          {allowlistId && allowlistCapId && (
            <div className="p-5 bg-red-50 border-4 border-red-500 rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mt-0.5">
                  <span className="text-white text-lg font-bold">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                    ⚠️ CRITICAL: Save Your Admin Cap ID Now
                  </p>
                  <p className="text-sm text-red-800 leading-relaxed mb-2">
                    <strong>Without the Cap ID below, you will PERMANENTLY LOSE the ability to manage who can access your dataset.</strong>
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    There is NO recovery method. This is your only chance to save it. Copy both IDs to a secure location before closing this window.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-red-800 mb-1 font-bold">Allowlist ID</p>
                  <p className="text-xs text-red-950 font-mono break-all bg-white px-3 py-2 rounded border-2 border-red-300">
                    {allowlistId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-red-800 mb-1 font-bold">🔑 Admin Cap ID (SAVE THIS!)</p>
                  <p className="text-xs text-red-950 font-mono break-all bg-white px-3 py-2 rounded border-2 border-red-400">
                    {allowlistCapId}
                  </p>
                </div>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="pt-3 border-t-2 border-red-300">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={capIdSaved}
                    onChange={(e) => setCapIdSaved(e.target.checked)}
                    className="mt-1 w-5 h-5 text-red-600 border-red-400 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-red-900 group-hover:text-red-950 transition-colors">
                    I have securely saved the Admin Cap ID above to a safe location
                  </span>
                </label>
                {!capIdSaved && (
                  <p className="text-xs text-red-700 mt-2 ml-8">
                    ⚠️ You must acknowledge saving the Cap ID to proceed
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Grid of Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Timestamp</p>
              <p className="text-sm text-gray-800">
                {new Date(timestamp).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZoneName: 'short'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Format</p>
              <p className="text-sm text-gray-800">{format}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Schema Version</p>
              <p className="text-sm text-gray-800">{schemaVersion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Network</p>
              <p className="text-sm text-gray-800">Sui Testnet</p>
            </div>
          </div>

          {/* Registrant */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Registered By</p>
            <p className="text-xs text-gray-600 font-mono">{registrant}</p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Verification Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <p className="text-xs text-gray-700">TEE Verified & On-Chain</p>
                </div>
              </div>
              <a
                href={`https://suiscan.xyz/testnet/tx/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span>View Transaction</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 opacity-5">
          <Image
            src="/logo.svg"
            alt="SealTrust"
            width={80}
            height={80}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-700 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Receipt</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-700 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadReceipt}
          disabled={downloading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary/90 rounded-lg text-sm text-white font-medium transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating...' : 'Download PNG'}</span>
        </button>
      </div>

      {/* Share URL */}
      <div className="relative overflow-hidden rounded-lg bg-gray-50 border border-gray-200 p-4">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        <p className="text-xs text-gray-500 mb-2">Verification URL</p>
        <p className="text-xs text-gray-600 font-mono break-all">{receiptUrl}</p>
      </div>

      {/* QR Code */}
      <div className="pt-6 border-t border-gray-200">
        <h3 className="font-semibold mb-4 text-center">Verification QR Code</h3>
        <div className="flex justify-center bg-white p-3 rounded-lg border border-gray-200">
          <QRCode
            value={receiptUrl}
            size={140}
          />
        </div>
        <p className="text-xs text-center text-gray-500 mt-2">
          Scan to verify this dataset
        </p>
      </div>
    </div>
  );

  // If onClose is provided, wrap in modal
  if (onClose) {
    const hasAccessControl = allowlistId && allowlistCapId;
    const canClose = !hasAccessControl || capIdSaved;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
          <button
            onClick={canClose ? onClose : undefined}
            disabled={!canClose}
            className={`sticky top-4 left-full ml-4 p-2 rounded-lg border shadow-lg transition-all z-10 ${
              canClose
                ? 'bg-white hover:bg-gray-100 border-gray-200 cursor-pointer'
                : 'bg-red-100 border-red-400 cursor-not-allowed opacity-50'
            }`}
            title={!canClose ? "Please acknowledge saving the Cap ID first" : "Close"}
          >
            <X className={`w-5 h-5 ${canClose ? 'text-gray-600' : 'text-red-600'}`} />
          </button>
          <div className="p-6">
            {content}

            {/* Warning if trying to close without acknowledgment */}
            {hasAccessControl && !capIdSaved && (
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  ⚠️ Cannot Close Yet
                </p>
                <p className="text-xs text-yellow-800">
                  Please acknowledge that you have saved the Admin Cap ID before closing this receipt.
                  Check the box above to proceed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render inline
  return content;
}
