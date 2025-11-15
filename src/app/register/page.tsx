'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { DatasetReceipt } from '@/components/dataset-receipt';
import { ArrowLeft, Database, Lightning, Shield, Clock, Upload } from '@phosphor-icons/react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import { useNautilus } from '@/hooks/useNautilus';
import { useTruthMarket } from '@/hooks/useTruthMarket';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

export default function RegisterPage() {
  const currentAccount = useCurrentAccount();
  const [datasetUrl, setDatasetUrl] = useState('');
  const [format, setFormat] = useState('CSV');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'input' | 'verifying' | 'registering' | 'complete'>('input');
  const [receiptData, setReceiptData] = useState<any>(null);

  const { verifyDataset, loading: nautilusLoading } = useNautilus();
  const { registerDataset, loading: registerLoading } = useTruthMarket();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDatasetUrl(`file://${selectedFile.name}`);
    }
  };

  const handleVerifyWithNautilus = async () => {
    if (!datasetUrl && !file) {
      toast.error('Please provide a dataset URL or upload a file');
      return;
    }

    setStep('verifying');
    try {
      const result = await verifyDataset({
        datasetUrl: datasetUrl || `file://${file?.name}`,
        format,
      });

      if (result) {
        toast.success('Dataset verified by Nautilus TEE!');
        // Automatically proceed to registration
        await handleRegisterOnChain(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
      setStep('input');
    }
  };

  const handleRegisterOnChain = async (verificationData: any) => {
    if (!currentAccount) {
      toast.error('Please connect your wallet');
      setStep('input');
      return;
    }

    setStep('registering');
    try {
      const result = await registerDataset({
        datasetUrl: datasetUrl || `file://${file?.name}`,
        hash: verificationData.hash,
        signature: verificationData.signature,
        format,
      });

      if (result) {
        setReceiptData({
          datasetUrl: datasetUrl || `file://${file?.name}`,
          hash: verificationData.hash,
          timestamp: Date.now(),
          txId: result.txId,
          nftId: result.nftId,
          registrant: currentAccount.address,
          format,
        });
        setStep('complete');
        toast.success('Dataset registered on-chain!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      setStep('input');
    }
  };

  const isLoading = nautilusLoading || registerLoading;

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
            {/* Left Content */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                  Register Dataset
                </h1>
                <p className="text-xl text-muted-foreground">
                  Create a cryptographically signed timestamp for your AI training dataset.
                  Verified by TEE and recorded immutably on-chain.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield weight="duotone" size={24} className="text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">TEE Verified</h3>
                    <p className="text-muted-foreground text-sm">
                      Hash computed inside AWS Nitro Enclave for hardware-backed authenticity
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock weight="duotone" size={24} className="text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Immutable Timestamp</h3>
                    <p className="text-muted-foreground text-sm">
                      Blockchain record proves exact dataset state at registration time
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Lightning weight="duotone" size={24} className="text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Instant Verification</h3>
                    <p className="text-muted-foreground text-sm">
                      Sub-second finality on Sui blockchain with cryptographic proof
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm text-orange-900">
                  <strong>How it works:</strong> Your dataset is verified by Nautilus (AWS Nitro Enclave),
                  which computes a SHA-256 hash and signs it. This proof is then registered on Sui blockchain,
                  creating an immutable timestamp record.
                </p>
              </div>
            </div>

            {/* Right Registration Form */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl shadow-xl border border-border p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Database weight="regular" size={24} className="text-primary" />
                  <h2 className="text-2xl font-bold">Register Dataset</h2>
                </div>

                {step === 'complete' && receiptData ? (
                  <div className="space-y-6">
                    <DatasetReceipt {...receiptData} />

                    <div className="pt-6 border-t border-border">
                      <h3 className="font-semibold mb-4 text-center">Verification QR Code</h3>
                      <div className="flex justify-center bg-white p-4 rounded-lg">
                        <QRCode
                          value={`${window.location.origin}/verify?hash=${receiptData.hash}`}
                          size={200}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Scan to verify this dataset
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setStep('input');
                        setDatasetUrl('');
                        setFile(null);
                        setReceiptData(null);
                      }}
                      className="w-full px-6 py-3 rounded-xl border border-border hover:bg-muted transition-all"
                    >
                      Register Another Dataset
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Dataset URL Input */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Dataset URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/dataset.csv"
                        value={datasetUrl}
                        onChange={(e) => {
                          setDatasetUrl(e.target.value);
                          setFile(null);
                        }}
                        disabled={isLoading || !!file}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        URL to your dataset file
                      </p>
                    </div>

                    <div className="text-center text-muted-foreground text-sm">- OR -</div>

                    {/* File Upload */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Upload File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          onChange={handleFileChange}
                          disabled={isLoading || !!datasetUrl}
                          className="hidden"
                          accept=".csv,.json,.parquet"
                        />
                        <label
                          htmlFor="file-upload"
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                            file
                              ? 'border-primary bg-orange-50'
                              : 'border-border hover:border-primary hover:bg-muted'
                          } ${isLoading || datasetUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Upload weight="regular" size={20} />
                          <span className="text-sm">
                            {file ? file.name : 'Choose file to upload'}
                          </span>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Accepts CSV, JSON, Parquet files
                      </p>
                    </div>

                    {/* Format Selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Dataset Format
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                      >
                        <option value="CSV">CSV</option>
                        <option value="JSON">JSON</option>
                        <option value="Parquet">Parquet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Status Messages */}
                    {step === 'verifying' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          Verifying with Nautilus TEE...
                        </p>
                      </div>
                    )}

                    {step === 'registering' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-sm text-orange-900">
                          Registering on Sui blockchain...
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!currentAccount ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center">
                          Connect your wallet to register datasets
                        </p>
                        <SuiWalletButton />
                      </div>
                    ) : (
                      <button
                        onClick={handleVerifyWithNautilus}
                        disabled={isLoading || (!datasetUrl && !file)}
                        className="w-full px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading
                          ? 'Processing...'
                          : 'Verify & Register Dataset'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
