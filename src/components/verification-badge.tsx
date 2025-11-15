import { Shield, ExternalLink, CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface VerificationBadgeProps {
  hash: string;
  timestamp: number;
  signature: string;
  enclaveId?: string;
  txId?: string;
}

export function VerificationBadge({
  hash,
  timestamp,
  signature,
  enclaveId,
  txId
}: VerificationBadgeProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const truncateHash = (hash: string, start = 8, end = 8) => {
    if (hash.length <= start + end) return hash;
    return `${hash.slice(0, start)}...${hash.slice(-end)}`;
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-green-500/30 bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-green-900/20 p-6">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-green-500/5 animate-pulse" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield className="w-10 h-10 text-green-400" />
              <CheckCircle2 className="w-5 h-5 text-green-400 absolute -bottom-1 -right-1 bg-gray-900 rounded-full" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-400">Verification Complete</h3>
              <p className="text-sm text-gray-400">AWS Nitro Enclave Attestation</p>
            </div>
          </div>
          {txId && (
            <a
              href={`https://suiscan.xyz/testnet/tx/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-medium transition-all"
            >
              View on Sui Explorer
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Verification Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dataset Hash */}
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Dataset Hash (SHA-256)</p>
              <button
                onClick={() => copyToClipboard(hash, 'hash')}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Copy hash"
              >
                {copiedField === 'hash' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="font-mono text-xs text-green-400 break-all">
              {hash}
            </p>
          </div>

          {/* Timestamp */}
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <p className="text-sm font-medium text-gray-400 mb-2">Verification Timestamp</p>
            <p className="font-mono text-xs text-white">
              {formatDate(timestamp)}
            </p>
            <p className="font-mono text-xs text-gray-500 mt-1">
              Unix: {timestamp}
            </p>
          </div>

          {/* TEE Signature */}
          <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Enclave Signature</p>
              <button
                onClick={() => copyToClipboard(signature, 'signature')}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Copy signature"
              >
                {copiedField === 'signature' ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <p className="font-mono text-xs text-violet-400 break-all">
              {truncateHash(signature, 16, 16)}
            </p>
          </div>

          {/* Enclave ID */}
          {enclaveId && (
            <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-400">Enclave Config ID</p>
                <button
                  onClick={() => copyToClipboard(enclaveId, 'enclave')}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                  title="Copy enclave ID"
                >
                  {copiedField === 'enclave' ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="font-mono text-xs text-blue-400 break-all">
                {truncateHash(enclaveId, 12, 12)}
              </p>
            </div>
          )}
        </div>

        {/* Security Indicators */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 bg-green-900/20 rounded-lg p-3 border border-green-800/30">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-xs text-green-400 font-medium">TEE Verified</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-900/20 rounded-lg p-3 border border-blue-800/30">
            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-400 font-medium">Cryptographically Signed</span>
          </div>
          <div className="flex items-center gap-2 bg-violet-900/20 rounded-lg p-3 border border-violet-800/30">
            <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-xs text-violet-400 font-medium">Immutable Record</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-900/10 border border-blue-800/30 rounded-lg">
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-blue-400">Security Guarantee:</strong> This verification was computed inside an AWS Nitro Enclave,
            a hardware-isolated trusted execution environment. The signature proves that the hash was generated by the enclave and
            has not been tampered with.
          </p>
        </div>
      </div>
    </div>
  );
}
