import { useState } from 'react';
import { StellarKitError, FreighterNotInstalledError } from '@stellar-solutions/core';
import { useSorobanContext } from '../context/SorobanContext.js';
import { getFreighterAddress } from '../freighter.js';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: StellarKitError | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useWallet(): WalletState {
  const { network, setWalletAddress, walletAddress } = useSorobanContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<StellarKitError | null>(null);

  const connect = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const address = await getFreighterAddress(network);
      setWalletAddress(address);
    } catch (err) {
      if (err instanceof StellarKitError) {
        setError(err);
      } else {
        setError(new StellarKitError(String(err), 'UNKNOWN'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = (): void => {
    setWalletAddress(null);
  };

  return {
    address: walletAddress,
    isConnected: walletAddress !== null,
    isLoading,
    error,
    connect,
    disconnect,
  };
}
