'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { formatAddress } from '@/lib/utils';

interface DatasetQRProps {
  hash: string;
  datasetName?: string;
  timestamp?: number;
}

export function DatasetQR({ hash, datasetName, timestamp }: DatasetQRProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate verification URL
  const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?hash=${hash}`;

  // QR code value includes the full URL
  const qrValue = verificationUrl;

  useEffect(() => {
    // Add animation when QR code loads
    if (qrRef.current) {
      qrRef.current.style.opacity = '0';
      qrRef.current.style.transform = 'scale(0.95)';

      setTimeout(() => {
        if (qrRef.current) {
          qrRef.current.style.transition = 'all 0.3s ease';
          qrRef.current.style.opacity = '1';
          qrRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
  }, [hash]);

  return (
    <div className="space-y-6">
      {/* QR Code Container */}
      <div
        ref={qrRef}
        className="bg-white p-8 rounded-2xl shadow-inner border border-gray-100"
      >
        <div className="aspect-square">
          <QRCode
            value={qrValue}
            size={256}
            style={{ width: '100%', height: '100%' }}
            level="H"
            fgColor="#09090b"
            bgColor="#ffffff"
          />
        </div>
      </div>

      {/* Dataset Info */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Dataset Hash
          </p>
          <p className="font-mono text-sm break-all">
            {formatAddress(hash)}
          </p>
        </div>

        {datasetName && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Dataset Name
            </p>
            <p className="text-lg font-semibold">
              {datasetName}
            </p>
          </div>
        )}

        {timestamp && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Registered On
            </p>
            <p className="text-sm">
              {new Date(timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <p className="text-sm text-orange-900">
            Scan this code to verify dataset authenticity
          </p>
        </div>

        {/* Verification URL */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Verification URL
          </p>
          <p className="text-xs font-mono break-all text-primary">
            {verificationUrl}
          </p>
        </div>
      </div>
    </div>
  );
}