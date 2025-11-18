'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { DatasetReceipt } from '@/components/dataset-receipt';
import { ArrowLeft, Database, Lightning, Shield, Clock, Upload, Lock, Plus, X, ListPlus } from '@phosphor-icons/react';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { SuiWalletButton } from '@/components/wallet/SuiWalletButton';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { Transaction } from '@mysten/sui/transactions';
import { sealService } from '@/lib/seal-service';
import { walrusService } from '@/lib/walrus-service';
import { allowlistService } from '@/lib/allowlist-service';
import { CONFIG, ERROR_MESSAGES } from '@/lib/constants';
import { stringToVecU8, hexToVecU8, MetadataVerificationRequest } from '@/lib/types';
import { useDatasetFetch } from '@/hooks/useDatasetFetch';
import { validateDatasetURL, detectFormatFromURL, getValidationErrorMessage } from '@/lib/url-validation';

interface ReceiptData {
  datasetUrl: string;
  hash: string;
  blobId: string;
  policyId: string;
  timestamp: number;
  txId: string;
  nftId: string;
  registrant: string;
  format: string;
  allowlistId?: string;
  allowlistCapId?: string;
}

export default function RegisterPage() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { fetchDataset, progress: urlProgress } = useDatasetFetch();

  const [datasetUrl, setDatasetUrl] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState('CSV');
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<'input' | 'fetching' | 'hashing' | 'encrypting' | 'uploading' | 'verifying' | 'registering' | 'complete'>('input');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [progress, setProgress] = useState('');

  // Initial access list - users to add to allowlist during registration
  const [initialMembers, setInitialMembers] = useState<string[]>([]);
  const [newMemberInput, setNewMemberInput] = useState('');

  // Batch add state
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');

  // Error recovery cache - preserve intermediate results
  const [cachedResults, setCachedResults] = useState<{
    allowlistId?: string;
    allowlistCapId?: string;
    originalHash?: string;
    encryptedData?: Uint8Array;
    policyId?: string;
    blobId?: string;
    attestation?: {
      signature: string;
      [key: string]: unknown;
    };
  }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size
      if (selectedFile.size > CONFIG.MAX_FILE_SIZE) {
        toast.error(`File too large. Maximum size is ${CONFIG.MAX_FILE_SIZE_MB}MB`);
        return;
      }
      setFile(selectedFile);
      setDatasetUrl('');
      // Auto-detect format from file extension
      const ext = selectedFile.name.split('.').pop()?.toUpperCase();
      if (ext && ['CSV', 'JSON', 'PARQUET'].includes(ext)) {
        setFormat(ext);
      }
    }
  };

  // Helper functions for managing initial access list
  const handleAddMember = () => {
    const address = newMemberInput.trim();

    // Validate address format
    if (!address.startsWith('0x') || address.length !== 66) {
      toast.error('Invalid Sui address format (must be 0x... with 64 hex characters)');
      return;
    }

    // Check for duplicates
    if (initialMembers.includes(address)) {
      toast.error('This address is already in the list');
      return;
    }

    // Don't allow adding self (already added automatically)
    if (currentAccount && address === currentAccount.address) {
      toast.error('You will be added automatically as the dataset owner');
      return;
    }

    setInitialMembers([...initialMembers, address]);
    setNewMemberInput('');
    toast.success('Member added to initial access list');
  };

  const handleRemoveMember = (address: string) => {
    setInitialMembers(initialMembers.filter(a => a !== address));
    toast.success('Member removed from list');
  };

  // Parse batch input into addresses
  const parseBatchInput = (input: string): string[] => {
    return input
      .split(/[\n,\s]+/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
  };

  // Validate batch addresses
  const validateBatchAddresses = (addresses: string[]): { valid: string[], invalid: string[], duplicates: string[], existing: string[] } => {
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    const existing: string[] = [];
    const seen = new Set<string>();

    for (const address of addresses) {
      // Check format
      if (!address.startsWith('0x') || address.length !== 66) {
        invalid.push(address);
        continue;
      }

      // Check duplicates in input
      if (seen.has(address)) {
        duplicates.push(address);
        continue;
      }

      // Check if already in list
      if (initialMembers.includes(address)) {
        existing.push(address);
        continue;
      }

      // Don't allow adding self
      if (currentAccount && address === currentAccount.address) {
        existing.push(address);
        continue;
      }

      seen.add(address);
      valid.push(address);
    }

    return { valid, invalid, duplicates, existing };
  };

  // Handle batch add for initial members
  const handleBatchAdd = () => {
    if (!batchInput.trim()) {
      toast.error('Please enter at least one address');
      return;
    }

    const addresses = parseBatchInput(batchInput);
    const { valid, invalid, duplicates, existing } = validateBatchAddresses(addresses);

    // Show validation results
    if (invalid.length > 0) {
      toast.error(`${invalid.length} invalid address(es) found. Please check the format.`);
      return;
    }

    if (valid.length === 0) {
      toast.error('No valid addresses to add');
      return;
    }

    // Add all valid addresses
    setInitialMembers([...initialMembers, ...valid]);
    setBatchInput('');
    setBatchMode(false);

    // Show summary
    const messages: string[] = [];
    if (valid.length > 0) messages.push(`${valid.length} added`);
    if (duplicates.length > 0) messages.push(`${duplicates.length} duplicate(s) skipped`);
    if (existing.length > 0) messages.push(`${existing.length} already in list`);

    toast.success(messages.join(', '));
  };

  // V3 Architecture: Complete registration flow
  const handleRegisterDataset = async () => {
    // Validate input: need either file OR URL
    if (!file && !datasetUrl) {
      toast.error(ERROR_MESSAGES.NO_FILE_OR_URL);
      return;
    }

    if (!currentAccount) {
      toast.error(ERROR_MESSAGES.WALLET_NOT_CONNECTED);
      return;
    }

    try {
      let datasetFile: File;

      // Step 0: Fetch URL if provided
      if (datasetUrl && !file) {
        // Validate URL
        const validation = validateDatasetURL(datasetUrl);
        if (!validation.isValid) {
          toast.error(getValidationErrorMessage(validation.error!));
          return;
        }

        setStep('fetching');
        setProgress('Fetching dataset from URL...');

        try {
          datasetFile = await fetchDataset(datasetUrl);

          // Validate fetched file size
          if (datasetFile.size > CONFIG.MAX_FILE_SIZE) {
            toast.error(`${ERROR_MESSAGES.FILE_TOO_LARGE}: ${(datasetFile.size / 1024 / 1024).toFixed(2)}MB (max: ${CONFIG.MAX_FILE_SIZE_MB}MB)`);
            setStep('input');
            setProgress('');
            return;
          }

          // Auto-detect format from URL
          const urlFormat = detectFormatFromURL(datasetUrl);
          if (urlFormat !== 'Unknown') {
            setFormat(urlFormat);
          }

          console.log('✅ Fetched dataset:', datasetFile.name, datasetFile.size, 'bytes');
        } catch (error) {
          const message = error instanceof Error ? error.message : ERROR_MESSAGES.URL_FETCH_FAILED;
          toast.error(message);
          setStep('input');
          setProgress('');
          return;
        }
      } else {
        datasetFile = file!;
      }

      // Step 1: Initialize Seal with testnet key servers
      // Note: Seal creates its own SuiClient instance internally
      setProgress('Initializing Seal encryption service...');
      await sealService.initialize();

      // Step 2: Create allowlist for access control
      setProgress('Creating Seal allowlist for access control...');
      const { allowlistId, capId } = await allowlistService.createAllowlist(
        `Access for ${datasetFile.name}`,
        CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
        signAndExecuteTransaction,
        suiClient
      );

      console.log('✅ Allowlist created:', allowlistId);
      console.log('✅ Allowlist admin cap:', capId);

      // Cache allowlist for error recovery
      setCachedResults(prev => ({ ...prev, allowlistId, allowlistCapId: capId }));

      // Add uploader to allowlist automatically so they can download their own dataset
      setProgress('Adding uploader to allowlist...');
      await allowlistService.addUser(
        allowlistId,
        capId,
        currentAccount.address,
        CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
        signAndExecuteTransaction
      );
      console.log('✅ Uploader added to allowlist');

      // Add initial members if any were configured
      if (initialMembers.length > 0) {
        setProgress(`Adding ${initialMembers.length} initial member(s) to allowlist...`);
        for (const memberAddress of initialMembers) {
          await allowlistService.addUser(
            allowlistId,
            capId,
            memberAddress,
            CONFIG.SEAL_ALLOWLIST_PACKAGE_ID,
            signAndExecuteTransaction
          );
          console.log('✅ Added member to allowlist:', memberAddress);
        }
      }

      // Step 3 & 4: Hash and Encrypt with Seal (using allowlist namespace)
      // NOTE: encryptDataset now returns originalHash to avoid double hashing!
      setStep('encrypting');
      setProgress('Encrypting dataset with Seal (includes hashing)...');

      const { encryptedData, policyId, originalHash } = await sealService.encryptDataset(
        datasetFile,
        CONFIG.SEAL_PACKAGE_ID,
        allowlistId
      );

      // Cache results for error recovery
      setCachedResults(prev => ({ ...prev, originalHash, encryptedData, policyId }));

      console.log('✅ Original hash:', originalHash);
      console.log('✅ Encrypted. Policy ID:', policyId);

      // Step 3: Upload encrypted blob to Walrus
      setStep('uploading');
      setProgress('Uploading encrypted blob to Walrus...');
      // Ensure encryptedData is properly typed as Uint8Array
      const encryptedBlob = new Uint8Array(encryptedData);
      const { blobId } = await walrusService.uploadToWalrus(
        new File([encryptedBlob], `${datasetFile.name}.encrypted`, { type: 'application/octet-stream' }),
        CONFIG.WALRUS_EPOCHS
      );

      // Cache results for error recovery
      setCachedResults(prev => ({ ...prev, blobId }));

      console.log('✅ Uploaded to Walrus. Blob ID:', blobId);

      // Step 4: Prepare metadata for Nautilus verification
      setStep('verifying');
      setProgress('Sending metadata to Nautilus TEE for verification...');

      const timestamp = Date.now();
      const metadata = {
        dataset_id: stringToVecU8(crypto.randomUUID()),
        name: stringToVecU8(datasetFile.name),
        description: stringToVecU8(description || 'Dataset registered via TruthMarket'),
        format: stringToVecU8(datasetFile.type || format),
        size: datasetFile.size,
        original_hash: hexToVecU8(originalHash),  // Convert hex string to bytes
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

      // Cache attestation for error recovery
      setCachedResults(prev => ({ ...prev, attestation }));

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

      // Validate allowlist ID before passing to Move contract
      if (!allowlistId || allowlistId.trim() === '') {
        throw new Error('Invalid allowlist ID - allowlist creation may have failed');
      }

      // CRITICAL: Capture the NFT returned by the Move function
      // Pass allowlist ID as Option<ID> (Some(allowlistId))
      const [nft] = tx.moveCall({
        target: `${CONFIG.VERIFICATION_PACKAGE}::truthmarket::register_dataset_dev`,
        typeArguments: [`${CONFIG.VERIFICATION_PACKAGE}::truthmarket::TRUTHMARKET`],
        arguments: [
          tx.pure.vector('u8', metadata.name),
          tx.pure.vector('u8', metadata.format),
          tx.pure.u64(metadata.size),
          tx.pure.vector('u8', metadata.original_hash),
          tx.pure.vector('u8', hexToVecU8(metadataHash)),  // Convert hex string to bytes
          tx.pure.string(blobId.trim()),      // Remove any whitespace
          tx.pure.string(policyId.trim()),    // Remove any whitespace
          tx.pure.option('id', allowlistId.trim()),  // Option<ID> for allowlist (validated)
          tx.pure.u64(timestamp),
          tx.pure.vector('u8', signatureBytes),
          tx.object(CONFIG.ENCLAVE_ID),
        ],
      });

      // Transfer the NFT to the user (required by Move resource safety)
      tx.transferObjects([nft], tx.pure.address(currentAccount.address));

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
        (change) => change.type === 'created' && 'objectType' in change && change.objectType?.includes('DatasetNFT')
      );

      const nftId = (createdNFT && 'objectId' in createdNFT) ? createdNFT.objectId : '';

      // Success!
      setStep('complete');
      setReceiptData({
        datasetUrl: datasetUrl || `file://${datasetFile.name}`,
        hash: originalHash,
        blobId,
        policyId,
        timestamp,
        txId: result.digest,
        nftId,
        registrant: currentAccount.address,
        format: datasetFile.type || format,
        allowlistId: cachedResults.allowlistId,
        allowlistCapId: cachedResults.allowlistCapId,
      });

      // Clear cache on success
      setCachedResults({});

      toast.success('Dataset registered successfully! 🎉');

    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);

      // Don't clear cache - allow retry
      // Show helpful message about cached results
      if (Object.keys(cachedResults).length > 0) {
        toast.info('Progress saved. You can retry from where you left off.', { duration: 5000 });
      }

      setStep('input');
      setProgress('');
    }
  };

  const isLoading = step !== 'input' && step !== 'complete';

  // Get loading message and progress based on current step
  const getLoadingState = () => {
    const stepMap = {
      fetching: { message: 'Fetching Dataset', current: 1, total: 6, label: 'Downloading from URL' },
      hashing: { message: 'Computing Hash', current: 2, total: 6, label: 'Generating SHA-256 fingerprint' },
      encrypting: { message: 'Encrypting Dataset', current: 3, total: 6, label: 'Securing with Seal encryption' },
      uploading: { message: 'Uploading to Walrus', current: 4, total: 6, label: 'Storing on decentralized network' },
      verifying: { message: 'TEE Verification', current: 5, total: 6, label: 'Verifying with Nautilus enclave' },
      registering: { message: 'Registering on Blockchain', current: 6, total: 6, label: 'Creating immutable record' },
    };

    const state = stepMap[step as keyof typeof stepMap];
    return state || { message: 'Processing...', current: 1, total: 6, label: 'Please wait' };
  };

  const loadingState = getLoadingState();

  // Calculate actual progress percentage
  const getProgressPercentage = () => {
    // If fetching, use the actual URL download progress
    if (step === 'fetching' && urlProgress) {
      return urlProgress.percentage;
    }
    // Otherwise use step-based progress
    return Math.round((loadingState.current / loadingState.total) * 100);
  };

  const progressPercentage = getProgressPercentage();

  return (
    <>
      <Header />

      {/* Success Modal */}
      {step === 'complete' && receiptData && (
        <DatasetReceipt
          {...receiptData}
          onClose={() => {
            setStep('input');
            setReceiptData(null);
          }}
        />
      )}

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
            <div className="lg:sticky lg:top-20 relative">
              {/* Loading overlay - only on form */}
              {isLoading && (
                <div className="absolute inset-0 z-50 rounded-2xl overflow-hidden">
                  {/* Blur backdrop */}
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-md" />

                  {/* Loading card */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl border-2 border-primary/20 p-5 w-full max-w-sm">
                      <div className="flex flex-col items-center space-y-4">
                        {/* Animated spinner */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 opacity-20 animate-pulse" style={{ width: '64px', height: '64px' }} />
                          <Database weight="duotone" size={64} className="text-primary animate-pulse relative z-10" />
                        </div>

                        {/* Message */}
                        <div className="text-center space-y-2">
                          <h3 className="text-xl font-bold text-foreground">
                            {loadingState.message}
                          </h3>
                          <p className="text-muted-foreground text-xs">
                            {loadingState.label}
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Step {loadingState.current} of {loadingState.total}</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary transition-all duration-500 ease-out"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Animated dots */}
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Database weight="regular" size={24} className="text-primary" />
                  <h2 className="text-xl font-bold">Register Dataset</h2>
                </div>

                {step === 'complete' && receiptData ? (
                  <div className="space-y-4">
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
                  <div className="space-y-4">
                    {/* Dataset URL Input */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Dataset URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/dataset.csv"
                        value={datasetUrl}
                        onChange={(e) => {
                          setDatasetUrl(e.target.value);
                          // Clear file when URL is entered
                          if (e.target.value.trim()) {
                            setFile(null);
                          }
                          // Auto-detect format from URL
                          if (e.target.value.trim()) {
                            const urlFormat = detectFormatFromURL(e.target.value);
                            if (urlFormat !== 'Unknown') {
                              setFormat(urlFormat);
                            }
                          }
                        }}
                        disabled={isLoading || !!file}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50 text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported: GitHub, Kaggle, HuggingFace, Data.world, Google Cloud Storage, AWS S3
                      </p>
                    </div>

                    <div className="text-center text-muted-foreground text-xs">- OR -</div>

                    {/* File Upload */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
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
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
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
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Description (Optional)
                      </label>
                      <textarea
                        placeholder="Brief description of your dataset..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50 resize-none text-sm"
                      />
                    </div>

                    {/* Format Selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Dataset Format
                      </label>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2.5 rounded-xl bg-white border border-border focus:outline-none focus:border-primary transition-colors disabled:opacity-50 text-sm"
                      >
                        <option value="CSV">CSV</option>
                        <option value="JSON">JSON</option>
                        <option value="Parquet">Parquet</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Initial Access Configuration */}
                    <div className="border border-border rounded-xl p-4 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-purple-600" />
                          <h3 className="text-sm font-semibold text-foreground">
                            Initial Access Control (Optional)
                          </h3>
                        </div>

                        {/* Mode Toggle */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => setBatchMode(false)}
                            disabled={isLoading}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                              !batchMode
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            Single
                          </button>
                          <button
                            onClick={() => setBatchMode(true)}
                            disabled={isLoading}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                              batchMode
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <ListPlus className="w-3 h-3" />
                            Batch
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-3">
                        {batchMode
                          ? 'Paste multiple addresses separated by comma, newline, or space'
                          : 'Add wallet addresses that should have access to download this dataset. You\'ll be added automatically as the owner.'}
                      </p>

                      {/* Single Mode Input */}
                      {!batchMode && (
                        <div className="flex gap-2 mb-3">
                          <input
                            type="text"
                            value={newMemberInput}
                            onChange={(e) => setNewMemberInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                            placeholder="0x... (Sui wallet address)"
                            disabled={isLoading}
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 text-xs font-mono"
                          />
                          <button
                            onClick={handleAddMember}
                            disabled={isLoading || !newMemberInput.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      )}

                      {/* Batch Mode Input */}
                      {batchMode && (
                        <div className="space-y-2 mb-3">
                          <textarea
                            value={batchInput}
                            onChange={(e) => setBatchInput(e.target.value)}
                            placeholder="Paste multiple addresses (separated by comma, newline, or space)&#10;Example:&#10;0x1234...&#10;0x5678...&#10;0x9abc..."
                            rows={5}
                            disabled={isLoading}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-border focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 text-xs font-mono resize-none"
                          />
                          <button
                            onClick={handleBatchAdd}
                            disabled={isLoading || !batchInput.trim()}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                          >
                            <ListPlus className="w-4 h-4" />
                            Add All
                          </button>
                        </div>
                      )}

                      {/* Members List */}
                      {initialMembers.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            {initialMembers.length} {initialMembers.length === 1 ? 'member' : 'members'} will be added:
                          </p>
                          {initialMembers.map((address) => (
                            <div
                              key={address}
                              className="flex items-center justify-between p-2 bg-white rounded-lg border border-border"
                            >
                              <p className="text-xs font-mono text-foreground truncate flex-1 mr-2">
                                {address}
                              </p>
                              <button
                                onClick={() => handleRemoveMember(address)}
                                disabled={isLoading}
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status Messages */}
                    {step === 'fetching' && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <p className="text-sm text-purple-900 font-medium mb-2">
                          {progress || 'Fetching dataset from URL...'}
                        </p>
                        {urlProgress && (
                          <div className="space-y-1">
                            <div className="w-full bg-purple-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${urlProgress.percentage}%` }}
                              />
                            </div>
                            <p className="text-xs text-purple-700">
                              {urlProgress.percentage}% ({(urlProgress.loaded / 1024 / 1024).toFixed(2)}MB
                              {urlProgress.total > 0 && ` / ${(urlProgress.total / 1024 / 1024).toFixed(2)}MB`})
                            </p>
                          </div>
                        )}
                      </div>
                    )}

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
                          {progress || 'Encrypting dataset with Seal...'}
                        </p>
                      </div>
                    )}

                    {step === 'uploading' && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-900">
                          {progress || 'Uploading encrypted blob to Walrus...'}
                        </p>
                      </div>
                    )}

                    {step === 'verifying' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                          {progress || 'Verifying with Nautilus TEE...'}
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
                        disabled={isLoading || (!file && !datasetUrl)}
                        className="w-full px-6 py-3 rounded-xl gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isLoading
                          ? step === 'fetching'
                            ? 'Fetching Dataset...'
                            : 'Processing...'
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
