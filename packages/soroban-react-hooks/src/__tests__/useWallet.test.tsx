import { vi, describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../hooks/useWallet.js';
import { FreighterNotInstalledError } from '@stellar-solutions/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SorobanProvider } from '../context/SorobanProvider.js';
import type { ReactNode } from 'react';

vi.mock('../freighter.js', () => ({
  getFreighterAddress: vi.fn(),
  signWithFreighter: vi.fn(),
}));

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({ horizon: {}, rpc: {}, networkConfig: {}, withTimeout: vi.fn() })),
  };
});

import { getFreighterAddress } from '../freighter.js';

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <SorobanProvider network="testnet" queryClient={testQueryClient}>
      {children}
    </SorobanProvider>
  );
}

describe('useWallet', () => {
  it('starts disconnected', () => {
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('connect sets address and isConnected', async () => {
    vi.mocked(getFreighterAddress).mockResolvedValue('GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37');
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });
    await act(async () => { await result.current.connect(); });
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37');
  });

  it('disconnect clears address', async () => {
    vi.mocked(getFreighterAddress).mockResolvedValue('GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37');
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });
    await act(async () => { await result.current.connect(); });
    act(() => { result.current.disconnect(); });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
  });

  it('sets error on FreighterNotInstalledError', async () => {
    vi.mocked(getFreighterAddress).mockRejectedValue(new FreighterNotInstalledError());
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });
    await act(async () => { await result.current.connect(); });
    expect(result.current.error).toBeInstanceOf(FreighterNotInstalledError);
    expect(result.current.isConnected).toBe(false);
  });

  it('isLoading is true during connect', async () => {
    let resolve: (v: string) => void;
    const promise = new Promise<string>((r) => { resolve = r; });
    vi.mocked(getFreighterAddress).mockReturnValue(promise);
    const { result } = renderHook(() => useWallet(), { wrapper: TestWrapper });

    act(() => { void result.current.connect(); });
    expect(result.current.isLoading).toBe(true);
    await act(async () => { resolve!('GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37'); });
    expect(result.current.isLoading).toBe(false);
  });
});
