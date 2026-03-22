import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateWithJellyfin } from './auth.js';
import { AuthError } from './types.js';

const mockAuthResponse = {
  User: {
    Name: 'testuser',
    Id: 'user-guid-123',
    ServerId: 'server-guid-456',
  },
  AccessToken: 'hex-token-abc123',
  ServerId: 'server-guid-456',
};

describe('authenticateWithJellyfin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return auth result on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockAuthResponse), { status: 200 }),
    );

    const result = await authenticateWithJellyfin('https://jellyfin.example.com', 'testuser', 'password');

    expect(result).toEqual({
      token: 'hex-token-abc123',
      userId: 'user-guid-123',
      serverUrl: 'https://jellyfin.example.com',
      username: 'testuser',
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://jellyfin.example.com/Users/AuthenticateByName',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ Username: 'testuser', Pw: 'password' }),
      }),
    );
  });

  it('should throw unauthorized error on 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 401 }),
    );

    await expect(
      authenticateWithJellyfin('https://jellyfin.example.com', 'bad', 'creds'),
    ).rejects.toThrow(AuthError);

    await expect(
      authenticateWithJellyfin('https://jellyfin.example.com', 'bad', 'creds'),
    ).rejects.toMatchObject({ type: 'unauthorized' });
  });

  it('should throw network error on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      authenticateWithJellyfin('https://bad.server', 'user', 'pass'),
    ).rejects.toMatchObject({ type: 'network' });
  });

  it('should throw unknown error on non-401 HTTP errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('', { status: 500 }),
    );

    await expect(
      authenticateWithJellyfin('https://jellyfin.example.com', 'user', 'pass'),
    ).rejects.toMatchObject({ type: 'unknown' });
  });

  it('should normalize server URL without protocol', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockAuthResponse), { status: 200 }),
    );

    await authenticateWithJellyfin('jellyfin.example.com', 'testuser', 'password');

    expect(fetch).toHaveBeenCalledWith(
      'https://jellyfin.example.com/Users/AuthenticateByName',
      expect.anything(),
    );
  });

  it('should strip trailing slashes from server URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockAuthResponse), { status: 200 }),
    );

    await authenticateWithJellyfin('https://jellyfin.example.com///', 'testuser', 'password');

    expect(fetch).toHaveBeenCalledWith(
      'https://jellyfin.example.com/Users/AuthenticateByName',
      expect.anything(),
    );
  });

  it('should include X-Emby-Authorization header', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockAuthResponse), { status: 200 }),
    );

    await authenticateWithJellyfin('https://jellyfin.example.com', 'testuser', 'password');

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(callHeaders['X-Emby-Authorization']).toMatch(/^MediaBrowser Client=/);
  });
});
