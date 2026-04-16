import { describe, it, expect, vi } from 'vitest';
import { render, screen, renderHook } from '@testing-library/react';
import { SorobanProvider } from '../context/SorobanProvider.js';
import { useSorobanContext } from '../context/SorobanContext.js';
import { QueryClient } from '@tanstack/react-query';

// Mock createClient to avoid real network connections
vi.mock('@stellar-solutions/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@stellar-solutions/core')>();
  return {
    ...actual,
    createClient: vi.fn(() => ({ horizon: {}, rpc: {}, networkConfig: {}, withTimeout: vi.fn() })),
  };
});

const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SorobanProvider network="testnet" queryClient={testQueryClient}>
      {children}
    </SorobanProvider>
  );
}

describe('SorobanProvider', () => {
  it('renders children without error', () => {
    render(
      <SorobanProvider network="testnet" queryClient={testQueryClient}>
        <span>hello</span>
      </SorobanProvider>,
    );
    expect(screen.getByText('hello')).toBeDefined();
  });

  it('provides context with correct network', () => {
    const { result } = renderHook(() => useSorobanContext(), { wrapper: TestWrapper });
    expect(result.current.network).toBe('testnet');
  });

  it('throws when useSorobanContext used outside provider', () => {
    expect(() =>
      renderHook(() => useSorobanContext()),
    ).toThrow('useSorobanContext must be used within a SorobanProvider');
  });

  it('walletAddress starts as null', () => {
    const { result } = renderHook(() => useSorobanContext(), { wrapper: TestWrapper });
    expect(result.current.walletAddress).toBeNull();
  });
});
