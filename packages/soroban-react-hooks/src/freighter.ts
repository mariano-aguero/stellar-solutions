'use client';

import { FreighterNotInstalledError, NetworkMismatchError } from '@stellar-solutions/core';
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

  const networkInfo = await FreighterAPI.getNetwork();
  const rawNetwork = networkInfo.network;
  const normalized = FREIGHTER_NETWORK_MAP[rawNetwork.toUpperCase()];
  if (normalized === undefined || normalized !== expectedNetwork) {
    throw new NetworkMismatchError(expectedNetwork, rawNetwork);
  }

  const addressInfo = await FreighterAPI.getAddress();
  return addressInfo.address;
}

export async function signWithFreighter(xdr: string, network: string): Promise<string> {
  const result = await FreighterAPI.signTransaction(xdr, { networkPassphrase: network });
  return result.signedTxXdr;
}
