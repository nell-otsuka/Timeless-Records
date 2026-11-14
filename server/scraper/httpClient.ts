const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HttpClientOptions {
  userAgent: string;
  /** Minimum pause between two requests. */
  delayMs: number;
  retries?: number;
  timeoutMs?: number;
}

export interface HttpClient {
  get(url: string): Promise<string>;
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} for ${url}`);
  }
}

/** A polite fetcher: one request at a time, a fixed delay between requests, retries on 429/5xx. */
export function createHttpClient({ userAgent, delayMs, retries = 2, timeoutMs = 15_000 }: HttpClientOptions): HttpClient {
  let queue: Promise<unknown> = Promise.resolve();
  let lastRequestAt = 0;

  const request = async (url: string): Promise<string> => {
    for (let attempt = 0; ; attempt++) {
      const wait = lastRequestAt + delayMs - Date.now();
      if (wait > 0) await sleep(wait);
      lastRequestAt = Date.now();

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': userAgent, 'Accept-Language': 'fr-FR,fr;q=0.9', 'X-Requested-With': 'XMLHttpRequest' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) return await response.text();
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt >= retries) throw new HttpError(response.status, url);
      } catch (error) {
        if (error instanceof HttpError || attempt >= retries) throw error;
      }
      await sleep(delayMs * 2 ** (attempt + 1)); // back off
    }
  };

  return {
    // chain onto the queue so concurrent callers are serialized
    get: (url) => {
      const result = queue.then(() => request(url));
      queue = result.catch(() => undefined);
      return result;
    },
  };
}
