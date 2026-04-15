import { describe, it, expect, vi, afterEach } from 'vitest';
import { ReconnectScheduler } from '../reconnect.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('ReconnectScheduler', () => {
  it('schedules retry at 1000ms on first attempt', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const onMaxRetries = vi.fn();
    const scheduler = new ReconnectScheduler({ maxRetries: 5, onMaxRetries });

    scheduler.scheduleRetry(cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('schedules retry at 2000ms on second attempt', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const onMaxRetries = vi.fn();
    const scheduler = new ReconnectScheduler({ maxRetries: 5, onMaxRetries });

    scheduler.scheduleRetry(() => {});  // attempt 0 → 1000ms, increments to attempt 1
    vi.advanceTimersByTime(1000);
    scheduler.scheduleRetry(cb);        // attempt 1 → 2000ms
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2000);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('caps delay at 32000ms', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const onMaxRetries = vi.fn();
    const scheduler = new ReconnectScheduler({ maxRetries: 10, onMaxRetries });

    // Advance past 5 retries (2^5 = 32000ms cap)
    for (let i = 0; i < 5; i++) {
      scheduler.scheduleRetry(() => {});
      vi.advanceTimersByTime(32000);
    }

    scheduler.scheduleRetry(cb);
    vi.advanceTimersByTime(32000);
    expect(cb).toHaveBeenCalledOnce();
  });

  it('calls onMaxRetries when maxRetries exceeded', () => {
    vi.useFakeTimers();
    const onMaxRetries = vi.fn();
    const scheduler = new ReconnectScheduler({ maxRetries: 2, onMaxRetries });

    // Use up all retries
    scheduler.scheduleRetry(() => {}); vi.advanceTimersByTime(1000);  // attempt 0
    scheduler.scheduleRetry(() => {}); vi.advanceTimersByTime(2000);  // attempt 1
    // Now at attempt 2 which equals maxRetries
    scheduler.scheduleRetry(() => {});

    expect(onMaxRetries).toHaveBeenCalledOnce();
  });

  it('reset() restarts the attempt counter', () => {
    vi.useFakeTimers();
    const cb = vi.fn();
    const onMaxRetries = vi.fn();
    const scheduler = new ReconnectScheduler({ maxRetries: 5, onMaxRetries });

    // Advance to attempt 2
    scheduler.scheduleRetry(() => {}); vi.advanceTimersByTime(1000);
    scheduler.scheduleRetry(() => {}); vi.advanceTimersByTime(2000);

    scheduler.reset();

    // After reset, first attempt should be 1000ms again
    scheduler.scheduleRetry(cb);
    vi.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledOnce();
  });
});
