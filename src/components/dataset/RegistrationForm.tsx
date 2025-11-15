'use client';

import { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { toast } from 'sonner';
import {
  Database,
  CircleNotch,
  Warning,
  CheckCircle,
  FileText,
  FolderOpen,
  Archive,
  CloudArrowUp,
  FileCsv,
  FileImage
} from '@phosphor-icons/react';
import { formatAddress, cn } from '@/lib/utils';
import { RegistrationSuccess } from './RegistrationSuccess';

// Dataset size presets (in MB)
const DEFAULT_DATASET_SIZES = [
  { value: '1', label: 'Small', icon: FileText, description: 'Documents' },
  { value: '10', label: 'Medium', icon: FileCsv, description: 'CSV Files' },
  { value: '100', label: 'Large', icon: FolderOpen, description: 'Folder' },
  { value: '500', label: 'Images', icon: FileImage, description: 'Image Set' },
  { value: '1000', label: 'Archive', icon: Archive, description: 'ZIP/TAR' },
  { value: '5000', label: 'Cloud', icon: CloudArrowUp, description: 'Full DB' },
];

interface RegistrationFormProps {
  datasetUrl?: string;
  datasetName?: string;
  defaultSize?: string;
  showUrlInput?: boolean;
}

export function RegistrationForm({
  datasetUrl = '',
  datasetName,
  defaultSize,
  showUrlInput = true,
}: RegistrationFormProps) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const [url, setUrl] = useState(datasetUrl);
  const [size, setSize] = useState(defaultSize || '10');
  const [customSize, setCustomSize] = useState('');
  const [description, setDescription] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [mounted, setMounted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (datasetUrl) {
      setUrl(datasetUrl);
    }
  }, [datasetUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mounted || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!url || !url.startsWith('http')) {
      toast.error('Please enter a valid dataset URL');
      return;
    }

    const datasetSize = customSize || size;
    if (!datasetSize || parseFloat(datasetSize) <= 0) {
      toast.error('Please select a dataset size');
      return;
    }

    setRegistrationStatus('pending');

    try {
      // Create a transaction for dataset registration
      const tx = new Transaction();

      // TODO: Add actual Move call for dataset registration
      // For now, just simulate success

      signAndExecute(
        {
          transaction: tx,
          chain: 'sui:testnet',
        },
        {
          onSuccess: (result) => {
            setTxHash(result.digest);
            setRegistrationStatus('success');
            setShowSuccessModal(true);

            // Reset form after modal closes
            setTimeout(() => {
              setCustomSize('');
              setDescription('');
              setRegistrationStatus('idle');
            }, 5000);
          },
          onError: () => {
            setRegistrationStatus('failed');
            toast.error('Registration failed. Please try again.');
          },
        }
      );
    } catch (error) {
      setRegistrationStatus('failed');
      toast.error('Failed to register dataset');
    }
  };

  const isLoading = isPending || registrationStatus === 'pending';
  const isSuccess = registrationStatus === 'success';

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Register Dataset
          </h2>
          {datasetName && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">{datasetName}</span>
            </p>
          )}
        </div>

        {/* Dataset URL Input */}
        {showUrlInput && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Dataset URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/dataset.csv"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
        )}

        {/* Size Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Dataset Size (MB)
          </label>

          {/* Preset Sizes */}
          <div className="grid grid-cols-3 gap-2">
            {DEFAULT_DATASET_SIZES.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    setSize(preset.value);
                    setCustomSize('');
                  }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    "hover:border-primary hover:shadow-md",
                    size === preset.value && !customSize
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-center mb-1">
                    <Icon weight="duotone" size={24} className="text-primary" />
                  </div>
                  <div className="text-sm font-semibold">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </button>
              );
            })}
          </div>

          {/* Custom Size */}
          <input
            type="number"
            placeholder="Custom size (MB)"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            step="1"
            min="1"
            className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Optional Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            Description (Optional)
          </label>
          <textarea
            placeholder="Describe your dataset..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        {/* Registration Status */}
        {registrationStatus !== 'idle' && (
          <div className={cn(
            "p-4 rounded-lg flex items-start gap-3",
            isSuccess ? "bg-green-500/10 text-green-500" :
            registrationStatus === 'failed' ? "bg-red-500/10 text-red-500" :
            "bg-primary/10 text-primary"
          )}>
            {registrationStatus === 'pending' && <CircleNotch weight="regular" size={20} className="animate-spin mt-0.5" />}
            {isSuccess && <CheckCircle weight="fill" size={20} className="mt-0.5" />}
            {registrationStatus === 'failed' && <Warning weight="fill" size={20} className="mt-0.5" />}

            <div className="flex-1">
              <div className="font-medium">
                {registrationStatus === 'pending' && 'Registering dataset...'}
                {isSuccess && 'Dataset registered successfully!'}
                {registrationStatus === 'failed' && 'Registration failed'}
              </div>
              {txHash && (
                <a
                  href={`https://suiscan.xyz/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline hover:no-underline mt-1 block"
                >
                  View on Explorer →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!mounted || isLoading || !account || isSuccess}
          className={cn(
            "w-full py-3 px-4 rounded-lg font-medium transition-all",
            "flex items-center justify-center gap-2",
            "bg-gradient-to-r from-primary to-accent",
            "text-primary-foreground",
            "hover:shadow-lg hover:scale-[1.02]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
        >
          {isLoading ? (
            <>
              <CircleNotch weight="regular" size={20} className="animate-spin" />
              <span>Processing...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle weight="fill" size={20} />
              <span>Registered!</span>
            </>
          ) : (
            <>
              <Database weight="regular" size={20} />
              <span>Register Dataset</span>
            </>
          )}
        </button>
      </form>

      {/* Registration Success Modal */}
      <RegistrationSuccess
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        datasetUrl={url}
        size={customSize || size}
        txHash={txHash}
      />
    </div>
  );
}