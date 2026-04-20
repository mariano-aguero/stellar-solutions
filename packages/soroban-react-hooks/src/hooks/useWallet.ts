'use client';

import { StellarKitError } from '@stellar-solutions/core';
import { useCallback, useEffect, useState } from 'react';
import { useSorobanContext } from '../context/SorobanContext.js';
import { getFreighterAddress, getFreighterAddressIfAuthorized } from '../freighter.js';

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

  // Auto-restore: on mount (and whenever network changes), silently ask Freighter
  // for the address if the user already authorized this origin. Avoids a connection
  // loss on page refresh without popping up a fresh auth prompt.
  // biome-ignore lint/correctness/useExhaustiveDependencies: setWalletAddress is a stable useState setter
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (walletAddress !== null) return; // already connected — skip auto-restore
      const restored = await getFreighterAddressIfAuthorized(network);
      if (!cancelled && restored !== null) {
        setWalletAddress(restored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [network]);

  return {
    address: walletAddress,
    // Treat empty string (which Freighter can occasionally return on locked wallets)
    // the same as null — prevents a "connected but no address" inconsistent UI state.
    isConnected: Boolean(walletAddress),
    isLoading,
    error,
    connect,
    disconnect,
  };
}
