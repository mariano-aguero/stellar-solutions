'use client';

import { StellarKitError } from '@stellar-solutions/core';
import { useCallback, useState } from 'react';
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

  // useCallback with [network] — if network changes, consumers that captured connect
  // via deps (e.g. useEffect(() => { connect() }, [connect])) will get the updated ref
  // and authenticate against the current network.
  const connect = useCallback(async (): Promise<void> => {
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
  }, [network, setWalletAddress]);

  const disconnect = useCallback((): void => {
    setWalletAddress(null);
  }, [setWalletAddress]);

  return {
    address: walletAddress,
    isConnected: walletAddress !== null,
    isLoading,
    error,
    connect,
    disconnect,
  };
}
