import type { TxResult } from '@stellar-solutions/soroban-react-hooks';
import { signWithFreighter } from '@stellar-solutions/soroban-react-hooks';
import {
  Address,
  Contract,
  Networks,
  rpc as RpcModule,
  TransactionBuilder,
  nativeToScVal,
} from '@stellar/stellar-sdk';

export interface SacTransferArgs {
  contractId: string;
  from: string;
  to: string;
  /** Raw integer amount in the token's smallest unit (stroops for XLM). */
  amount: bigint;
  networkPassphrase?: string;
}

/**
 * Full Soroban contract-invocation flow against the native XLM SAC (or any
 * SAC-shaped contract exposing `transfer(from: Address, to: Address, amount: i128)`).
 *
 * simulate → assemble with footprint → sign with Freighter → send → poll for status.
 */
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[sacTransfer] ${label} failed:`, err);
    throw new Error(`${label}: ${msg}`);
  }
}

export async function sacTransfer(
  rpcServer: RpcModule.Server,
  { contractId, from, to, amount, networkPassphrase = Networks.TESTNET }: SacTransferArgs,
): Promise<TxResult> {
  // 1. Load source account for sequence number (RPC endpoint, not Horizon)
  const sourceAccount = await step('getAccount', () => rpcServer.getAccount(from));

  // 2. Build the contract invocation
  const contract = new Contract(contractId);
  const rawTx = new TransactionBuilder(sourceAccount, {
    fee: '1000',
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'transfer',
        Address.fromString(from).toScVal(),
        Address.fromString(to).toScVal(),
        nativeToScVal(amount, { type: 'i128' }),
      ),
    )
    .setTimeout(30)
    .build();

  // 3. Simulate — Soroban needs this to discover the footprint (storage keys)
  //    and compute the resource fee. Non-simulated Soroban txs are rejected.
  const simulated = await step('simulate', () => rpcServer.simulateTransaction(rawTx));
  if (RpcModule.Api.isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  // 4. Assemble — merges the simulation's footprint/resource-fee into the tx
  const preparedTx = await step('assemble', async () =>
    RpcModule.assembleTransaction(rawTx, simulated).build(),
  );

  // 5. Sign with Freighter (user approves in the extension)
  const signedXdr = await step('sign', () =>
    signWithFreighter(preparedTx.toXDR(), networkPassphrase),
  );
  const signedTx = await step('parseSignedXdr', async () =>
    TransactionBuilder.fromXDR(signedXdr, networkPassphrase),
  );

  // 6. Submit
  const sendResponse = await step('send', () => rpcServer.sendTransaction(signedTx));
  if (sendResponse.status === 'ERROR') {
    const errXdr = sendResponse.errorResult?.toXDR('base64') ?? 'unknown';
    throw new Error(`Send failed (${sendResponse.status}): ${errXdr}`);
  }

  // 7. Poll for finality. Soroban txs confirm in ~5s; we poll at 1s intervals up to 30s.
  // The SDK can throw XDR parse errors ("Bad union switch") when the RPC returns a
  // result meta using a protocol version the SDK doesn't fully support — treat those
  // as "not ready yet" and keep polling; fall back to returning the hash if the window
  // expires so the caller still gets a usable TxResult they can verify on-chain.
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const status = await rpcServer.getTransaction(sendResponse.hash);
      if (status.status === 'SUCCESS') {
        return {
          hash: sendResponse.hash,
          ledger: status.ledger,
          fee: preparedTx.fee,
          createdAt: new Date(Number(status.createdAt) * 1000).toISOString(),
        };
      }
      if (status.status === 'FAILED') {
        throw new Error(`Transaction failed on-chain: ${sendResponse.hash}`);
      }
      // NOT_FOUND → keep polling
    } catch (err) {
      // Re-throw our own "failed on-chain" signal; swallow XDR parse errors and retry.
      if (err instanceof Error && err.message.startsWith('Transaction failed on-chain')) {
        throw err;
      }
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Timed out polling but the tx was accepted by the RPC — return the hash anyway.
  // Stellar Expert will reflect final status; the balance query will refresh via invalidation.
  return {
    hash: sendResponse.hash,
    ledger: 0,
    fee: preparedTx.fee,
    createdAt: new Date().toISOString(),
  };
}
