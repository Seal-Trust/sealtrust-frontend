'use client';

import { useState } from 'react';
import { useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { Wallet, SignOut } from '@phosphor-icons/react';
import { formatAddress } from '@/lib/utils';
import { WalletModal } from './WalletModal';

export function SuiWalletButton() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const [showModal, setShowModal] = useState(false);

  if (currentAccount) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 text-primary font-medium hover:bg-orange-100 transition-all"
      >
        <Wallet weight="fill" size={18} />
        <span className="hidden sm:inline">{formatAddress(currentAccount.address)}</span>
        <span className="sm:hidden">{formatAddress(currentAccount.address).slice(0, 8)}</span>
        <SignOut weight="regular" size={16} className="ml-1" />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 rounded-lg gradient-primary text-white font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
      >
        <Wallet weight="bold" size={18} />
        <span>Connect Wallet</span>
      </button>

      {/* Custom Wallet Modal */}
      <WalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
