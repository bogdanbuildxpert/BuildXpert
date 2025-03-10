export function listen(
  channel: string,
  callback: (payload: string) => void
): void;
export function notify(channel: string, payload: string): Promise<void>;
