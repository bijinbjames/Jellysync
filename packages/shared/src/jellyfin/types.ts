export interface AuthCredentials {
  serverUrl: string;
  username: string;
  password: string;
}

export interface JellyfinUserInfo {
  Name: string;
  Id: string;
  ServerId: string;
}

export interface JellyfinAuthResponse {
  User: JellyfinUserInfo;
  AccessToken: string;
  ServerId: string;
}

export interface AuthResult {
  token: string;
  userId: string;
  serverUrl: string;
  username: string;
}

export type AuthErrorType = 'network' | 'unauthorized' | 'timeout' | 'unknown';

export class AuthError extends Error {
  type: AuthErrorType;

  constructor(type: AuthErrorType, message: string) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
  }
}
