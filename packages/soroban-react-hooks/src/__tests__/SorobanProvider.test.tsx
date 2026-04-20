import { QueryClient } from '@tanstack/react-query';
import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSorobanContext } from '../context/SorobanContext.js';
import { SorobanProvider } from '../context/SorobanProvider.js';

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
    expect(() => renderHook(() => useSorobanContext())).toThrow(
      'useSorobanContext must be used within a SorobanProvider',
    );
  });

  it('walletAddress starts as null', () => {
    const { result } = renderHook(() => useSorobanContext(), { wrapper: TestWrapper });
    expect(result.current.walletAddress).toBeNull();
  });
});
