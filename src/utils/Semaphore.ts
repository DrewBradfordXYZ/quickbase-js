// src/Semaphore.ts
export class Semaphore {
  private permits: number;
  private waiting: Array<{ resolve: () => void; reject: (err: any) => void }> =
    [];

  constructor(maxPermits: number) {
    this.permits = maxPermits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits -= 1;
      return;
    }
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject });
    });
  }

  release(): void {
    this.permits += 1;
    if (this.waiting.length > 0 && this.permits > 0) {
      const { resolve } = this.waiting.shift()!;
      this.permits -= 1;
      resolve();
    }
  }

  available(): number {
    return this.permits;
  }
}
