import { Horizon, rpc as RpcModule } from '@stellar/stellar-sdk';
import { NetworkTimeoutError } from './errors.js';
import { type Network, type NetworkConfig, getNetworkConfig } from './network.js';

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
  /** Allow http:// URLs (defaults to true only if the URL is actually http — for local dev). */
  allowHttp?: boolean;
}

export function createClient(network: Network, options: ClientOptions = {}): StellarClient {
  const timeout = options.timeout ?? 30_000;
  const overrides: Partial<Pick<NetworkConfig, 'horizonUrl' | 'sorobanRpcUrl'>> = {};
  if (options.horizonUrl !== undefined) overrides.horizonUrl = options.horizonUrl;
  if (options.sorobanRpcUrl !== undefined) overrides.sorobanRpcUrl = options.sorobanRpcUrl;
  const networkConfig = getNetworkConfig(network, overrides);

  const horizonHttp = options.allowHttp ?? networkConfig.horizonUrl.startsWith('http://');
  const rpcHttp = options.allowHttp ?? networkConfig.sorobanRpcUrl.startsWith('http://');
  const horizon = new Horizon.Server(networkConfig.horizonUrl, { allowHttp: horizonHttp });
  const rpc = new RpcModule.Server(networkConfig.sorobanRpcUrl, { allowHttp: rpcHttp });

  function withTimeout<T>(promise: Promise<T>): Promise<T> {
    let timerId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = setTimeout(() => reject(new NetworkTimeoutError(timeout)), timeout);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timerId));
  }

  return { horizon, rpc, networkConfig, withTimeout };
}
