export interface ReconnectOptions {
  maxRetries: number;
  onMaxRetries: () => void;
}

export class ReconnectScheduler {
  private attempt = 0;

  constructor(private readonly options: ReconnectOptions) {}

  scheduleRetry(callback: () => void): void {
    if (this.attempt >= this.options.maxRetries) {
      this.options.onMaxRetries();
      return;
    }
    const delay = Math.min(2 ** this.attempt * 1000, 32_000);
    this.attempt++;
    setTimeout(callback, delay);
  }

  reset(): void {
    this.attempt = 0;
  }
}
