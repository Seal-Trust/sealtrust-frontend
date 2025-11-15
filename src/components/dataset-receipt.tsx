"use client";

import { useState } from "react";
import Image from "next/image";
import { Share2, Download, Copy, Check, ExternalLink } from "lucide-react";
import { toPng } from "html-to-image";

interface DatasetReceiptProps {
  datasetUrl: string;
  hash: string;
  timestamp: number;
  txId: string;
  nftId: string;
  registrant: string;
  format?: string;
  schemaVersion?: string;
}

export function DatasetReceipt({
  datasetUrl,
  hash,
  timestamp,
  txId,
  nftId,
  registrant,
  format = "CSV",
  schemaVersion = "v1.0"
}: DatasetReceiptProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const receiptUrl = `${window.location.origin}/verify?hash=${hash}`;

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
        backgroundColor: '#000000',
      });

      const link = document.createElement('a');
      link.download = `truthmarket-receipt-${hash.slice(0, 12)}.png`;
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
          title: 'TruthMarket Dataset Receipt',
          text: `Verified dataset registration on TruthMarket`,
          url: receiptUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Receipt Card */}
      <div
        id="receipt-content"
        className="relative overflow-hidden rounded-lg bg-black border border-gray-800 p-8"
      >
        {/* Glassmorphism effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-900">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="TruthMarket"
              width={40}
              height={40}
              className="filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
            />
            <div>
              <h3 className="text-xl font-medium bg-gradient-to-b from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                TRUTH MARKET
              </h3>
              <p className="text-xs text-gray-600">Cryptographic Dataset Registry</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Certificate of Registration</p>
            <p className="text-xs text-gray-500 font-mono">#{nftId.slice(0, 12)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Dataset Info */}
          <div>
            <p className="text-xs text-gray-600 mb-2">Dataset URL</p>
            <p className="text-sm text-white/90 font-medium break-all leading-relaxed">
              {datasetUrl}
            </p>
          </div>

          {/* Hash */}
          <div>
            <p className="text-xs text-gray-600 mb-2">SHA-256 Hash</p>
            <p className="text-xs text-gray-400 font-mono break-all leading-relaxed">
              {hash}
            </p>
          </div>

          {/* Grid of Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-900">
            <div>
              <p className="text-xs text-gray-600 mb-1">Timestamp</p>
              <p className="text-sm text-white/80">
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
              <p className="text-xs text-gray-600 mb-1">Format</p>
              <p className="text-sm text-white/80">{format}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Schema Version</p>
              <p className="text-sm text-white/80">{schemaVersion}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">Network</p>
              <p className="text-sm text-white/80">Sui Testnet</p>
            </div>
          </div>

          {/* Registrant */}
          <div className="pt-4 border-t border-gray-900">
            <p className="text-xs text-gray-600 mb-1">Registered By</p>
            <p className="text-xs text-gray-400 font-mono">{registrant}</p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Verification Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                  <p className="text-xs text-white/60">TEE Verified & On-Chain</p>
                </div>
              </div>
              <a
                href={`https://suiscan.xyz/testnet/tx/${txId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
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
            alt="TruthMarket"
            width={80}
            height={80}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-gray-700 rounded-lg text-sm text-white/90 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Receipt</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-gray-700 rounded-lg text-sm text-white/90 transition-all"
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
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-gray-800 hover:border-gray-700 rounded-lg text-sm text-white/90 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating...' : 'Download PNG'}</span>
        </button>
      </div>

      {/* Share URL */}
      <div className="relative overflow-hidden rounded-lg bg-white/[0.02] border border-gray-800 p-4">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <p className="text-xs text-gray-600 mb-2">Verification URL</p>
        <p className="text-xs text-gray-400 font-mono break-all">{receiptUrl}</p>
      </div>
    </div>
  );
}
