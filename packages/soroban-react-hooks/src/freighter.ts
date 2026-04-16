import * as FreighterAPI from '@stellar/freighter-api';
import { FreighterNotInstalledError, NetworkMismatchError } from '@stellar-solutions/core';

export async function getFreighterAddress(expectedNetwork: string): Promise<string> {
  const connected = await FreighterAPI.isConnected();
  if (!connected.isConnected) throw new FreighterNotInstalledError();

  const networkInfo = await FreighterAPI.getNetwork();
  const network = networkInfo.network;
  if (!network.toLowerCase().includes(expectedNetwork.toLowerCase())) {
    throw new NetworkMismatchError(expectedNetwork, network);
  }

  const addressInfo = await FreighterAPI.getAddress();
  return addressInfo.address;
}

export async function signWithFreighter(xdr: string, network: string): Promise<string> {
  const result = await FreighterAPI.signTransaction(xdr, { networkPassphrase: network });
  return result.signedTxXdr;
}
