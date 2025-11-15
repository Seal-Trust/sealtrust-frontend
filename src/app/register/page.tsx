'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { DatasetReceipt } from '@/components/dataset-receipt';
import { ArrowLeft, Database, Lightning, Shield, Clock, Upload } from '@phosphor-icons/react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Transaction } from '@mysten/sui/transactions';
import { sealService } from '@/lib/seal-service';
import { walrusService } from '@/lib/walrus-service';
import { CONFIG } from '@/lib/constants';
import { stringToVecU8, hexToVecU8, MetadataVerificationRequest } from '@/lib/types';

export default function RegisterPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [datasetUrl, setDatasetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('CSV');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'input' | 'hashing' | 'encrypting' | 'uploading' | 'verifying' | 'registering' | 'complete'>('input');
  const [progress, setProgress] = useState('');
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDatasetUrl(`file://${selectedFile.name}`);
    }
  };

  // V3 Architecture: Complete registration flow
  const handleRegisterDataset = async () => {
    if (!file) {
      toast.error('Please upload a file');
      return;
    }

    if (!currentAccount) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      // Step 1: Hash file BEFORE encryption (CRITICAL!)
      setStep('hashing');
      setProgress('Computing hash of original file...');
      const originalHash = await sealService.hashFile(file);
      console.log('✅ Original hash:', originalHash);

      // Step 2: Encrypt with Seal
      setStep('encrypting');
      setProgress('Encrypting dataset with Seal...');
      const { encryptedData, policyId } = await sealService.encryptDataset(
        file,
        CONFIG.SEAL_PACKAGE_ID
      );
      console.log('✅ Encrypted. Policy ID:', policyId);

      // Step 3: Upload encrypted blob to Walrus
      setStep('uploading');
      setProgress('Uploading encrypted blob to Walrus...');
      const { blobId } = await walrusService.uploadToWalrus(
        new File([encryptedData], `${file.name}.encrypted`, { type: 'application/octet-stream' }),
        CONFIG.WALRUS_EPOCHS
      );
      console.log('✅ Uploaded to Walrus. Blob ID:', blobId);

      // Step 4: Prepare metadata for Nautilus verification
      setStep('verifying');
      setProgress('Sending metadata to Nautilus TEE for verification...');

      const timestamp = Date.now();
      const metadata = {
        dataset_id: stringToVecU8(crypto.randomUUID()),
        name: stringToVecU8(file.name),
        description: stringToVecU8(description || 'Dataset registered via TruthMarket'),
        format: stringToVecU8(file.type || format),
        size: file.size,
        original_hash: stringToVecU8(originalHash),
        walrus_blob_id: stringToVecU8(blobId),
        seal_policy_id: stringToVecU8(policyId),
        timestamp,
        uploader: stringToVecU8(currentAccount.address),
      };

      const nautilusRequest: MetadataVerificationRequest = { metadata };

      const nautilusResponse = await fetch(`${CONFIG.NAUTILUS_URL}/verify_metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nautilusRequest),
      });

      if (!nautilusResponse.ok) {
        const error = await nautilusResponse.json();
        throw new Error(`Nautilus verification failed: ${error.error || nautilusResponse.statusText}`);
      }

      const attestation = await nautilusResponse.json();
      console.log('✅ Nautilus attestation received');

      // Step 5: Register on-chain
      setStep('registering');
      setProgress('Registering dataset on Sui blockchain...');

      const tx = new Transaction();

      // Compute metadata hash (for DatasetNFT.metadata_hash field)
      const metadataString = JSON.stringify(metadata);
      const metadataHash = await sealService.hashData(new TextEncoder().encode(metadataString));

      // Convert signature from hex to bytes (Nautilus returns hex-encoded)
      const signatureBytes = hexToVecU8(attestation.signature);

      tx.moveCall({
        target: `${CONFIG.VERIFICATION_PACKAGE}::truthmarket::register_dataset_dev`,
        typeArguments: [`${CONFIG.VERIFICATION_PACKAGE}::truthmarket::TRUTHMARKET`],
        arguments: [
          tx.pure.vector('u8', metadata.name),
          tx.pure.vector('u8', metadata.format),
          tx.pure.u64(metadata.size),
          tx.pure.vector('u8', metadata.original_hash),
          tx.pure.vector('u8', stringToVecU8(metadataHash)),
          tx.pure.string(blobId),
          tx.pure.string(policyId),
          tx.pure.u64(timestamp),
          tx.pure.vector('u8', signatureBytes),
          tx.object(CONFIG.ENCLAVE_ID),
        ],
      });

      tx.setGasBudget(100_000_000);

      const result = await signAndExecuteTransaction({
        transaction: tx,
        chain: 'sui:testnet',
      });

      console.log('✅ Transaction successful:', result.digest);

      // Get NFT ID from transaction
      const txResponse = await suiClient.getTransactionBlock({
        digest: result.digest,
        options: { showObjectChanges: true },
      });

      const createdNFT = txResponse.objectChanges?.find(
        (change: any) => change.type === 'created' && change.objectType?.includes('DatasetNFT')
      );

      const nftId = (createdNFT as any)?.objectId || '';

      // Success!
      setStep('complete');
      setReceiptData({
        datasetUrl: datasetUrl || `file://${file.name}`,
        hash: originalHash,
        blobId,
        policyId,
        timestamp,
        txId: result.digest,
        nftId,
        registrant: currentAccount.address,
        format: file.type || format,
      });

      toast.success('Dataset registered successfully! 🎉');

    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.message || 'Registration failed');
      setStep('input');
      setProgress('');
    }
  };

  const isLoading = step !== 'input' && step !== 'complete';

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

                    {/* Description Input */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description (Optional)
                      </label>
                      <textarea
                        placeholder="Brief description of your dataset..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50 resize-none"
                      />
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
                    {step === 'hashing' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          Computing hash of original file...
                        </p>
                      </div>
                    )}

                    {step === 'encrypting' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-purple-900">
                          Encrypting dataset with Seal...
                        </p>
                      </div>
                    )}

                    {step === 'uploading' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-900">
                          Uploading encrypted blob to Walrus...
                        </p>
                      </div>
                    )}

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
                        onClick={handleRegisterDataset}
                        disabled={isLoading || !file}
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
