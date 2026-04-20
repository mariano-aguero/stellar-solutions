import {
  useSorobanBalance,
  useSorobanInvoke,
  useWallet,
} from '@stellar-solutions/soroban-react-hooks';
import { Asset, Networks } from '@stellar/stellar-sdk';
import { useState } from 'react';
import { sacTransfer } from './sacTransfer.js';

// Native XLM wrapped as a Stellar Asset Contract (SAC) — deterministic per network.
// Any classic XLM balance shows up here when queried through the SAC `balance` method.
// Must use Asset.native() (not `new Asset('native')` — the constructor rejects a null issuer).
const XLM_SAC_CONTRACT = Asset.native().contractId(Networks.TESTNET);
const TOKEN_SYMBOL = 'XLM';
// Native XLM uses 7-decimal precision (stroops) — the SAC returns the raw integer.
const TOKEN_DECIMALS = 7;
// Transfer 0.1 XLM per click — 1,000,000 stroops. Small enough to click many times.
const TRANSFER_AMOUNT_STROOPS = 1_000_000n;

function formatTokenAmount(raw: string | undefined, decimals: number): string {
  if (!raw || raw === '0') return '0';
  const padded = raw.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals);
  const frac = padded.slice(-decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

function truncate(value: string, head = 6, tail = 4): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function App() {
  const { address, connect, disconnect, isConnected, isLoading, error } = useWallet();
  const { data: balance, isLoading: balanceLoading } = useSorobanBalance(
    XLM_SAC_CONTRACT,
    address ?? null,
  );
  // Self-transfer — simplest end-to-end demo of the full Soroban flow:
  // simulate → assemble → sign → submit → poll. Balance only decreases by the
  // fee (≈ 0.01 XLM), and the query cache auto-invalidates on success so the
  // new balance re-fetches without any extra plumbing from the consumer.
  const {
    invoke,
    isPending,
    data: txResult,
    error: invokeError,
  } = useSorobanInvoke<[string]>(XLM_SAC_CONTRACT, 'transfer', {
    mutateFn: async (rpcServer, [selfAddress]) =>
      sacTransfer(rpcServer, {
        contractId: XLM_SAC_CONTRACT,
        from: selfAddress,
        to: selfAddress,
        amount: TRANSFER_AMOUNT_STROOPS,
      }),
  });
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Soroban Hooks</h1>
          <p className="text-sm text-neutral-400">
            Demo for{' '}
            <code className="text-neutral-300">@stellar-solutions/soroban-react-hooks</code> ·
            testnet
          </p>
        </header>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 shadow-sm">
          {!isConnected ? (
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <p className="text-sm font-medium text-neutral-200">Wallet</p>
                <p className="text-xs text-neutral-500">
                  Connect Freighter on Stellar Testnet to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={connect}
                disabled={isLoading}
                className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connecting…' : 'Connect Freighter'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Address</p>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="font-mono text-sm text-neutral-200 hover:text-white transition flex items-center gap-1.5"
                    title={address ?? ''}
                  >
                    <span>{address ? truncate(address) : '—'}</span>
                    <span className="text-xs text-neutral-500">{copied ? '✓ copied' : '⧉'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={disconnect}
                  className="shrink-0 rounded-md border border-neutral-800 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-100 hover:border-neutral-700 transition"
                >
                  Disconnect
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {TOKEN_SYMBOL} Balance
                </p>
                <p className="font-mono text-2xl font-medium tracking-tight">
                  {balanceLoading ? (
                    <span className="text-neutral-500">…</span>
                  ) : (
                    <>
                      <span>{formatTokenAmount(balance, TOKEN_DECIMALS)}</span>{' '}
                      <span className="text-sm text-neutral-500">{TOKEN_SYMBOL}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => address && void invoke([address])}
                  disabled={isPending || !address}
                  className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Submitting…' : `Self-transfer 0.1 ${TOKEN_SYMBOL}`}
                </button>
                <p className="text-xs text-neutral-500 text-center">
                  Invokes <code className="text-neutral-400">transfer</code> on the XLM SAC · sends
                  to yourself
                </p>
              </div>

              {txResult && (
                <div className="rounded-md border border-emerald-900/50 bg-emerald-950/30 p-3">
                  <p className="text-xs font-medium text-emerald-400 mb-1">Transaction sent</p>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txResult.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-emerald-300 hover:text-emerald-200 break-all underline decoration-emerald-800"
                  >
                    {truncate(txResult.hash)} · view on Stellar Expert →
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {(error || invokeError) && (
          <div className="rounded-md border border-red-900/50 bg-red-950/30 p-3">
            <p className="text-xs font-medium text-red-400 mb-0.5">
              {error?.code ?? invokeError?.code ?? 'Error'}
            </p>
            <p className="text-xs text-red-300">{error?.message ?? invokeError?.message}</p>
          </div>
        )}

        <footer className="text-center">
          <a
            href="https://github.com/mariano-aguero/stellar-solutions"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-500 hover:text-neutral-300 transition"
          >
            stellar-solutions on GitHub ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
