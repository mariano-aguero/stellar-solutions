import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SorobanProvider } from '../context/SorobanProvider.js';
import { useSorobanInvoke } from '../hooks/useSorobanInvoke.js';

vi.mock('../freighter.js', () => ({
  getFreighterAddress: vi.fn(),
  signWithFreighter: vi.fn(),
}));

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({
      horizon: {},
      rpc: {},
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: vi.fn(),
    })),
  };
});

const mockTxResult = { hash: 'abc123', ledger: 1, fee: '100', createdAt: '2024-01-01T00:00:00Z' };

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SorobanProvider network="testnet" queryClient={qc}>
        {children}
      </SorobanProvider>
    );
  };
}

describe('useSorobanInvoke', () => {
  it('invoke calls mutateFn and returns TxResult', async () => {
    const mutateFn = vi.fn().mockResolvedValue(mockTxResult);
    const { result } = renderHook(() => useSorobanInvoke('CONTRACT_ID', 'transfer', { mutateFn }), {
      wrapper: makeWrapper(),
    });
    let txResult: typeof mockTxResult | undefined;
    await act(async () => {
      txResult = await result.current.invoke(['ARG1', 'ARG2']);
    });
    expect(txResult).toEqual(mockTxResult);
    expect(mutateFn).toHaveBeenCalledWith(expect.anything(), ['ARG1', 'ARG2']);
  });

  it('isPending is true during invoke', async () => {
    let resolve: (v: typeof mockTxResult) => void;
    const promise = new Promise<typeof mockTxResult>((r) => {
      resolve = r;
    });
    const mutateFn = vi.fn().mockReturnValue(promise);
    const { result } = renderHook(() => useSorobanInvoke('CONTRACT_ID', 'transfer', { mutateFn }), {
      wrapper: makeWrapper(),
    });
    // Start the mutation without awaiting it so we can inspect isPending
    let _invokePromise: Promise<typeof mockTxResult>;
    act(() => {
      _invokePromise = result.current.invoke([]);
    });
    await waitFor(() => expect(result.current.isPending).toBe(true));
    // Resolve and wait for completion
    act(() => {
      resolve!(mockTxResult);
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });

  it('sets error when mutateFn throws', async () => {
    const mutateFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useSorobanInvoke('CONTRACT_ID', 'transfer', { mutateFn }), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      try {
        await result.current.invoke([]);
      } catch {
        /* swallow */
      }
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
  });

  it('invalidates soroban queries on success', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
    const mutateFn = vi.fn().mockResolvedValue(mockTxResult);
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <SorobanProvider network="testnet" queryClient={qc}>
        {children}
      </SorobanProvider>
    );
    const { result } = renderHook(() => useSorobanInvoke('CONTRACT_ID', 'transfer', { mutateFn }), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await result.current.invoke([]);
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['soroban', 'CONTRACT_ID'] });
  });

  it('throws when no mutateFn provided', async () => {
    const { result } = renderHook(() => useSorobanInvoke('CONTRACT_ID', 'transfer'), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await expect(result.current.invoke([])).rejects.toThrow('No mutateFn provided');
    });
  });
});
