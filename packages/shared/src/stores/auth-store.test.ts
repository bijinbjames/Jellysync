import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthStore } from './auth-store.js';
import type { StateStorage } from 'zustand/middleware';

vi.mock('../jellyfin/auth.js', () => ({
  authenticateWithJellyfin: vi.fn(),
}));

import { authenticateWithJellyfin } from '../jellyfin/auth.js';
import { AuthError } from '../jellyfin/types.js';

const mockStorage: StateStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

describe('createAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const store = createAuthStore(mockStorage);
    const state = store.getState();

    expect(state.serverUrl).toBeNull();
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.username).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('should set state on successful login', async () => {
    vi.mocked(authenticateWithJellyfin).mockResolvedValue({
      token: 'test-token',
      userId: 'user-123',
      serverUrl: 'https://jellyfin.example.com',
      username: 'testuser',
    });

    const store = createAuthStore(mockStorage);
    await store.getState().login('https://jellyfin.example.com', 'testuser', 'password');

    const state = store.getState();
    expect(state.serverUrl).toBe('https://jellyfin.example.com');
    expect(state.token).toBe('test-token');
    expect(state.userId).toBe('user-123');
    expect(state.username).toBe('testuser');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should set error state on failed login', async () => {
    vi.mocked(authenticateWithJellyfin).mockRejectedValue(
      new AuthError('unauthorized', 'Username or password incorrect'),
    );

    const store = createAuthStore(mockStorage);

    await expect(
      store.getState().login('https://jellyfin.example.com', 'bad', 'creds'),
    ).rejects.toThrow();

    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Username or password incorrect');
    expect(state.errorField).toBe('credentials');
  });

  it('should set server errorField for network errors', async () => {
    vi.mocked(authenticateWithJellyfin).mockRejectedValue(
      new AuthError('network', "Can't connect to server — check the URL"),
    );

    const store = createAuthStore(mockStorage);

    await expect(
      store.getState().login('https://bad.server', 'user', 'pass'),
    ).rejects.toThrow();

    const state = store.getState();
    expect(state.errorField).toBe('server');
  });

  it('should clear state on logout', async () => {
    vi.mocked(authenticateWithJellyfin).mockResolvedValue({
      token: 'test-token',
      userId: 'user-123',
      serverUrl: 'https://jellyfin.example.com',
      username: 'testuser',
    });

    const store = createAuthStore(mockStorage);
    await store.getState().login('https://jellyfin.example.com', 'testuser', 'password');
    store.getState().logout();

    const state = store.getState();
    expect(state.serverUrl).toBeNull();
    expect(state.token).toBeNull();
    expect(state.userId).toBeNull();
    expect(state.username).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.errorField).toBeNull();
  });

  it('should update persist storage on logout', async () => {
    vi.mocked(authenticateWithJellyfin).mockResolvedValue({
      token: 'test-token',
      userId: 'user-123',
      serverUrl: 'https://jellyfin.example.com',
      username: 'testuser',
    });

    const store = createAuthStore(mockStorage);
    await store.getState().login('https://jellyfin.example.com', 'testuser', 'password');

    vi.mocked(mockStorage.setItem).mockClear();
    store.getState().logout();

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'jellysync-auth',
      expect.stringContaining('"isAuthenticated":false'),
    );
  });

  it('should invalidate pending login on logout', async () => {
    let resolveLogin: (value: unknown) => void;
    const loginPromise = new Promise((resolve) => { resolveLogin = resolve; });
    vi.mocked(authenticateWithJellyfin).mockReturnValue(loginPromise as Promise<Awaited<ReturnType<typeof authenticateWithJellyfin>>>);

    const store = createAuthStore(mockStorage);
    const loginCall = store.getState().login('https://jellyfin.example.com', 'testuser', 'password');

    store.getState().logout();

    resolveLogin!({
      token: 'stale-token',
      userId: 'user-123',
      serverUrl: 'https://jellyfin.example.com',
      username: 'testuser',
    });

    await loginCall;

    const state = store.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it('should set hydration flag', () => {
    const store = createAuthStore(mockStorage);
    store.getState().setHydrated(true);

    expect(store.getState().isHydrated).toBe(true);
  });
});
