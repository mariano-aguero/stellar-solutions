import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StellarNotify } from '../StellarNotify.js';

vi.mock('../watcher.js', () => ({
  startWatcher: vi.fn(() => vi.fn()),
}));

describe('StellarNotify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a WatchHandle when watch() is called', () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    const handle = notifier.watch('GABC...');
    expect(handle).toBeDefined();
    expect(typeof handle.on).toBe('function');
  });

  it('returns the same WatchHandle for the same address', () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    const h1 = notifier.watch('GABC...');
    const h2 = notifier.watch('GABC...');
    expect(h1).toBe(h2);
  });

  it('stop() removes the watcher', () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    const h1 = notifier.watch('GABC...');
    notifier.stop('GABC...');
    // After stop, watch() returns a new handle
    const newHandle = notifier.watch('GABC...');
    expect(newHandle).toBeDefined();
    expect(newHandle).not.toBe(h1);
  });

  it('stopAll() stops all watchers', () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    const h1 = notifier.watch('GABC...');
    const h2 = notifier.watch('GDEF...');
    notifier.stopAll();
    // After stopAll, watching same addresses returns new handles
    const newH1 = notifier.watch('GABC...');
    const newH2 = notifier.watch('GDEF...');
    expect(newH1).not.toBe(h1);
    expect(newH2).not.toBe(h2);
  });

  it('stop() on unknown address does nothing', () => {
    const notifier = new StellarNotify({ network: 'testnet' });
    expect(() => notifier.stop('GUNKNOWN...')).not.toThrow();
  });

  it('calls the stop function when stop() is called', async () => {
    const { startWatcher } = await import('../watcher.js');
    const mockStop = vi.fn();
    vi.mocked(startWatcher).mockReturnValueOnce(mockStop);

    const notifier = new StellarNotify({ network: 'testnet' });
    notifier.watch('GABC...');
    notifier.stop('GABC...');

    expect(mockStop).toHaveBeenCalledOnce();
  });

  it('accepts custom maxRetries option', () => {
    const notifier = new StellarNotify({ network: 'testnet', maxRetries: 10 });
    const handle = notifier.watch('GABC...');
    expect(handle).toBeDefined();
  });

  it('works with mainnet network', () => {
    const notifier = new StellarNotify({ network: 'mainnet' });
    const handle = notifier.watch('GABC...');
    expect(handle).toBeDefined();
  });
});
