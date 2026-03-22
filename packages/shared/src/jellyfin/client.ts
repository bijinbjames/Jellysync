const CLIENT_NAME = 'JellySync';
const CLIENT_VERSION = '1.0.0';
const DEVICE_NAME = 'JellySync App';

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  if (typeof globalThis.localStorage !== 'undefined') {
    const stored = globalThis.localStorage.getItem('jellysync_device_id');
    if (stored) {
      cachedDeviceId = stored;
      return stored;
    }
  }
  const id = globalThis.crypto?.randomUUID?.() ?? `jsc-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  cachedDeviceId = id;
  if (typeof globalThis.localStorage !== 'undefined') {
    try { globalThis.localStorage.setItem('jellysync_device_id', id); } catch { /* quota exceeded */ }
  }
  return id;
}

export function buildAuthHeader(token?: string): string {
  const parts = [
    `Client="${CLIENT_NAME}"`,
    `Device="${DEVICE_NAME}"`,
    `DeviceId="${getDeviceId()}"`,
    `Version="${CLIENT_VERSION}"`,
  ];
  if (token) {
    parts.push(`Token="${token}"`);
  }
  return `MediaBrowser ${parts.join(', ')}`;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function makeRequest<T>(
  serverUrl: string,
  path: string,
  token?: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const url = `${serverUrl.replace(/\/+$/, '')}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Emby-Authorization': buildAuthHeader(token),
    ...(options.headers as Record<string, string> | undefined),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw response;
  }

  try {
    return await response.json() as T;
  } catch {
    throw new Error('Invalid JSON response from server');
  }
}
