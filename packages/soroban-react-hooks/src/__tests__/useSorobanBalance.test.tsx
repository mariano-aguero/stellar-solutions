import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SorobanProvider } from '../context/SorobanProvider.js';
import { useSorobanBalance } from '../hooks/useSorobanBalance.js';

const VALID_ADDRESS = 'GCKG2FITNKLHYMKLUQW3ZDTC2CWZ6LTZ2R76TEFJQO7XHDFNTOJD5SYL';

// Mock stellar-sdk classes used inside useSorobanBalance
vi.mock('@stellar/stellar-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar/stellar-sdk')>();
  return {
    ...actual,
    Contract: vi.fn().mockImplementation(() => ({
      call: vi.fn().mockReturnValue({ type: 'invokeHostFunction' }),
    })),
    Address: {
      fromString: vi.fn().mockReturnValue({ toScVal: vi.fn().mockReturnValue({}) }),
    },
    Account: vi.fn().mockImplementation(() => ({})),
    TransactionBuilder: vi.fn().mockImplementation(() => ({
      addOperation: vi.fn().mockReturnThis(),
      setTimeout: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({ toXDR: vi.fn() }),
    })),
    scValToNative: vi.fn().mockReturnValue(1000000n),
  };
});

vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({
      horizon: {},
      rpc: {
        simulateTransaction: vi.fn().mockResolvedValue({
          result: { retval: {} },
        }),
      },
      networkConfig: { networkPassphrase: 'Test SDF Network ; September 2015' },
      withTimeout: vi.fn((p: Promise<unknown>) => p),
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

describe('useSorobanBalance', () => {
  it('is disabled when address is null', () => {
    const { result } = renderHook(() => useSorobanBalance('CONTRACT_ID', null), {
      wrapper: makeWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns balance string when address is provided', async () => {
    const { result } = renderHook(() => useSorobanBalance('CONTRACT_ID', VALID_ADDRESS), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(typeof result.current.data).toBe('string');
    expect(result.current.data).toBe('1000000');
  });
});
