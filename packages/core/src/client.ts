import { Horizon, rpc as RpcModule } from '@stellar/stellar-sdk';
import { getNetworkConfig, type Network, type NetworkConfig } from './network.js';
import { NetworkTimeoutError } from './errors.js';

export interface StellarClient {
  horizon: Horizon.Server;
  rpc: RpcModule.Server;
  networkConfig: NetworkConfig;
  withTimeout<T>(promise: Promise<T>): Promise<T>;
}

export interface ClientOptions {
  horizonUrl?: string;
  sorobanRpcUrl?: string;
  timeout?: number;
}

export function createClient(network: Network, options: ClientOptions = {}): StellarClient {
  const timeout = options.timeout ?? 30_000;
  const overrides: Partial<Pick<NetworkConfig, 'horizonUrl' | 'sorobanRpcUrl'>> = {};
  if (options.horizonUrl !== undefined) overrides.horizonUrl = options.horizonUrl;
  if (options.sorobanRpcUrl !== undefined) overrides.sorobanRpcUrl = options.sorobanRpcUrl;
  const networkConfig = getNetworkConfig(network, overrides);

  const horizon = new Horizon.Server(networkConfig.horizonUrl, { allowHttp: false });
  const rpc = new RpcModule.Server(networkConfig.sorobanRpcUrl, { allowHttp: false });

  function withTimeout<T>(promise: Promise<T>): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new NetworkTimeoutError(timeout)), timeout),
      ),
    ]);
  }

  return { horizon, rpc, networkConfig, withTimeout };
}
