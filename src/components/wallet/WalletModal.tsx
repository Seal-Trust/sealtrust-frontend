'use client';

import { useState, useEffect } from 'react';
import { useWallets, useConnectWallet } from '@mysten/dapp-kit';
import {
  X,
  Wallet,
  CheckCircle,
  CircleNotch,
  Warning,
  ArrowSquareOut,
  Shield
} from '@phosphor-icons/react';
import Image from 'next/image';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const wallets = useWallets();
  const { mutate: connect, isPending, isError } = useConnectWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedWallet(null);
    }
  }, [isOpen]);

  const handleConnect = (wallet: typeof wallets[0]) => {
    setSelectedWallet(wallet.name);
    connect(
      { wallet },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error('Failed to connect:', error);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Wallet weight="bold" size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Connect Wallet</h2>
                <p className="text-sm text-muted-foreground">
                  Choose your wallet to continue
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X weight="regular" size={20} />
            </button>
          </div>
        </div>

        {/* Wallet List */}
        <div className="p-6 space-y-3">
          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <Warning weight="regular" size={48} className="mx-auto mb-4 text-orange-500" />
              <h3 className="font-semibold mb-2">No Wallets Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please install a Sui wallet to continue
              </p>
              <a
                href="https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                Install Sui Wallet
                <ArrowSquareOut weight="regular" size={16} />
              </a>
            </div>
          ) : (
            <>
              {wallets.map((wallet) => {
                const isConnecting = selectedWallet === wallet.name && isPending;
                const hasError = selectedWallet === wallet.name && isError;

                return (
                  <button
                    key={wallet.name}
                    onClick={() => handleConnect(wallet)}
                    disabled={isPending}
                    className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${
                      isConnecting
                        ? 'bg-orange-50 border-orange-200'
                        : hasError
                        ? 'bg-red-50 border-red-200'
                        : 'bg-white border-border hover:border-primary hover:shadow-md'
                    } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {/* Wallet Icon */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                      {wallet.icon ? (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-8 h-8"
                        />
                      ) : (
                        <Wallet weight="regular" size={24} className="text-gray-600" />
                      )}
                    </div>

                    {/* Wallet Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{wallet.name}</h3>
                        {wallet.name.includes('Sui') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {wallet.chains?.includes('sui:testnet') && 'Testnet'}
                        {wallet.chains?.includes('sui:mainnet') &&
                          (wallet.chains?.includes('sui:testnet') ? ' & Mainnet' : 'Mainnet')}
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {isConnecting ? (
                        <CircleNotch
                          weight="regular"
                          size={20}
                          className="animate-spin text-primary"
                        />
                      ) : hasError ? (
                        <Warning weight="fill" size={20} className="text-red-500" />
                      ) : (
                        <Shield weight="regular" size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Error Message */}
              {isError && selectedWallet && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-800">
                    Failed to connect to {selectedWallet}. Please try again.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield weight="duotone" size={16} className="text-primary" />
            <span>Your wallet connection is secure and encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}