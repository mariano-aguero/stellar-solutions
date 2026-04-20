export interface ReconnectOptions {
  maxRetries: number;
  onMaxRetries: () => void;
}

export class ReconnectScheduler {
  private attempt = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: ReconnectOptions) {}

  scheduleRetry(callback: () => void): void {
    if (this.attempt >= this.options.maxRetries) {
      this.options.onMaxRetries();
      return;
    }
    const delay = Math.min(2 ** this.attempt * 1000, 32_000);
    this.attempt++;
    this.timerId = setTimeout(() => {
      this.timerId = null;
      callback();
    }, delay);
  }

  /**
   * Cancel any pending retry timer. Must be called on stop/teardown to prevent
   * ghost reconnections from firing after the watcher is no longer needed.
   */
  cancel(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  reset(): void {
    this.attempt = 0;
  }
}
