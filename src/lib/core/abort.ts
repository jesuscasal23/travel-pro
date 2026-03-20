class RequestAbortedError extends Error {
  constructor(message: string = "Request aborted") {
    super(message);
    this.name = "AbortError";
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    error instanceof RequestAbortedError || (error instanceof Error && error.name === "AbortError")
  );
}

export function throwIfAborted(signal?: AbortSignal | null): void {
  if (signal?.aborted) {
    throw new RequestAbortedError();
  }
}

export function abortableDelay(ms: number, signal?: AbortSignal | null): Promise<void> {
  if (!signal) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new RequestAbortedError());
      return;
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      cleanup();
      reject(new RequestAbortedError());
    };

    const cleanup = () => {
      signal.removeEventListener("abort", onAbort);
    };

    signal.addEventListener("abort", onAbort, { once: true });
  });
}
