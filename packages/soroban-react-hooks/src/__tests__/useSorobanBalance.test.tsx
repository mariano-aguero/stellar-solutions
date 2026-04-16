import { vi, describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSorobanBalance } from '../hooks/useSorobanBalance.js';
import { QueryClient } from '@tanstack/react-query';
import { SorobanProvider } from '../context/SorobanProvider.js';
import type { ReactNode } from 'react';

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({
      horizon: {},
      rpc: {},
      networkConfig: {},
      withTimeout: vi.fn(),
    })),
  };
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SorobanProvider network="testnet" queryClient={qc}>{children}</SorobanProvider>;
  };
}

describe('useSorobanBalance', () => {
  it('is disabled when address is null', () => {
    const { result } = renderHook(
      () => useSorobanBalance('CONTRACT_ID', null),
      { wrapper: makeWrapper() },
    );
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns balance string when address is provided', async () => {
    const { result } = renderHook(
      () => useSorobanBalance('CONTRACT_ID', 'GABC123'),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(typeof result.current.data).toBe('string');
  });
});
