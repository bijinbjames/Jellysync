import { makeRequest } from './client.js';
import { AuthError, type AuthResult, type JellyfinAuthResponse } from './types.js';

export async function authenticateWithJellyfin(
  serverUrl: string,
  username: string,
  password: string,
): Promise<AuthResult> {
  const normalizedUrl = normalizeServerUrl(serverUrl);

  let response: JellyfinAuthResponse;
  try {
    response = await makeRequest<JellyfinAuthResponse>(
      normalizedUrl,
      '/Users/AuthenticateByName',
      undefined,
      {
        method: 'POST',
        body: JSON.stringify({ Username: username, Pw: password }),
      },
    );
  } catch (error: unknown) {
    if (error instanceof Response) {
      if (error.status === 401) {
        throw new AuthError('unauthorized', 'Username or password incorrect');
      }
      throw new AuthError('unknown', 'Something went wrong — try again');
    }
    if (error instanceof TypeError) {
      throw new AuthError('network', "Can't connect to server — check the URL");
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AuthError('timeout', 'Server took too long to respond — try again');
    }
    if (error instanceof Error && error.message === 'Invalid JSON response from server') {
      throw new AuthError('network', "Can't connect to server — check the URL");
    }
    throw new AuthError('unknown', 'Something went wrong — try again');
  }

  if (!response.AccessToken || !response.User?.Id || !response.User?.Name) {
    throw new AuthError('unknown', 'Something went wrong — try again');
  }

  return {
    token: response.AccessToken,
    userId: response.User.Id,
    serverUrl: normalizedUrl,
    username: response.User.Name,
  };
}

function normalizeServerUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `http://${normalized}`;
  }
  return normalized.replace(/\/+$/, '');
}
