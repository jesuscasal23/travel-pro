/**
 * Parse a ReadableStream of SSE frames and invoke a callback for each parsed event.
 * Returns the final accumulated result via the `onEvent` callback's side-effects.
 */
export async function consumeSSEStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: Record<string, unknown>) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processFrame = (frame: string) => {
    let payload = "";
    for (const line of frame.split("\n")) {
      const normalized = line.trim();
      if (!normalized.startsWith("data:")) continue;
      payload += normalized.slice(5).trim();
    }
    if (!payload) return;

    try {
      const event = JSON.parse(payload) as Record<string, unknown>;
      onEvent(event);
    } catch (e) {
      if (e instanceof SyntaxError) return;
      throw e instanceof Error ? e : new Error("SSE parse error");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }
    const normalized = buffer.replace(/\r\n/g, "\n");
    const frames = normalized.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) processFrame(frame);
    if (done) break;
  }

  if (buffer.trim()) processFrame(buffer);
}
