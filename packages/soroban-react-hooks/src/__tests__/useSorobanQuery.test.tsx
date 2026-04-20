import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SorobanProvider } from '../context/SorobanProvider.js';
import { useSorobanQuery } from '../hooks/useSorobanQuery.js';

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({
      horizon: {},
      rpc: { simulateTransaction: vi.fn() },
      networkConfig: {},
      withTimeout: vi.fn(),
    })),
  };
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SorobanProvider network="testnet" queryClient={qc}>
        {children}
      </SorobanProvider>
    );
  };
}

describe('useSorobanQuery', () => {
  it('returns data from queryFn', async () => {
    const { result } = renderHook(
      () =>
        useSorobanQuery<string>('CONTRACT_ID', 'hello', {
          queryFn: async () => 'world',
        }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('world');
  });

  it('is disabled when enabled: false', () => {
    const { result } = renderHook(
      () =>
        useSorobanQuery<string>('CONTRACT_ID', 'hello', {
          queryFn: async () => 'world',
          enabled: false,
        }),
      { wrapper: makeWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('throws when no queryFn provided', async () => {
    const { result } = renderHook(() => useSorobanQuery<string>('CONTRACT_ID', 'hello'), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('No queryFn provided');
  });
});
