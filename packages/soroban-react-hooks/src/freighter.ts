'use client';

import {
  FreighterNotInstalledError,
  NetworkMismatchError,
  StellarKitError,
} from '@stellar-solutions/core';
import * as FreighterAPI from '@stellar/freighter-api';

// Freighter returns well-known network strings; map them to our canonical Network values.
// Strict mapping prevents false matches like "futurenet" matching expectedNetwork="test".
const FREIGHTER_NETWORK_MAP: Record<string, 'testnet' | 'mainnet'> = {
  TESTNET: 'testnet',
  PUBLIC: 'mainnet',
};

export async function getFreighterAddress(expectedNetwork: string): Promise<string> {
  const connected = await FreighterAPI.isConnected();
  if (!connected.isConnected) throw new FreighterNotInstalledError();

  // If this origin hasn't been approved yet, trigger the Freighter popup.
  // `requestAccess` resolves with the address once the user accepts, or with
  // an `error` field / empty address on decline.
  const allowed = await FreighterAPI.isAllowed();
  if (!allowed.isAllowed) {
    const accessResult = await FreighterAPI.requestAccess();
    if (accessResult.error) {
      throw new FreighterNotInstalledError();
    }
  }

  const networkInfo = await FreighterAPI.getNetwork();
  const rawNetwork = networkInfo.network;
  const normalized = FREIGHTER_NETWORK_MAP[rawNetwork.toUpperCase()];
  if (normalized === undefined || normalized !== expectedNetwork) {
    throw new NetworkMismatchError(expectedNetwork, rawNetwork);
  }

  const addressInfo = await FreighterAPI.getAddress();
  // Still empty after requestAccess means the wallet is locked or the user
  // declined — treat as not-installed so consumers don't end up with a truthy
  // "connected" state pointing to an empty string.
  if (!addressInfo.address) throw new FreighterNotInstalledError();
  return addressInfo.address;
}

/**
 * Silent variant for auto-restore on page load. Returns the address only if Freighter
 * is installed, the user previously authorized this origin, and the network matches.
 * Returns `null` in every other case (including errors) — never throws, never pops up.
 */
export async function getFreighterAddressIfAuthorized(
  expectedNetwork: string,
): Promise<string | null> {
  try {
    const connected = await FreighterAPI.isConnected();
    if (!connected.isConnected) return null;

    const allowed = await FreighterAPI.isAllowed();
    if (!allowed.isAllowed) return null;

    const networkInfo = await FreighterAPI.getNetwork();
    const normalized = FREIGHTER_NETWORK_MAP[networkInfo.network.toUpperCase()];
    if (normalized !== expectedNetwork) return null;

    const addressInfo = await FreighterAPI.getAddress();
    return addressInfo.address || null;
  } catch {
    return null;
  }
}

export async function signWithFreighter(xdr: string, network: string): Promise<string> {
  const result = await FreighterAPI.signTransaction(xdr, { networkPassphrase: network });
  if (result.error) {
    const msg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
    throw new StellarKitError(`Freighter signing failed: ${msg}`, 'FREIGHTER_SIGN_FAILED', {
      cause: result.error,
    });
  }
  if (!result.signedTxXdr) {
    throw new StellarKitError(
      'Freighter returned an empty signed transaction',
      'FREIGHTER_SIGN_EMPTY',
    );
  }
  return result.signedTxXdr;
}
