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

// Library types

export interface JellyfinLibraryItem {
  Id: string;
  Name: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  Overview?: string;
  ImageTags?: { Primary?: string };
  Type: string;
}

export interface JellyfinLibraryResponse {
  Items: JellyfinLibraryItem[];
  TotalRecordCount: number;
}

export interface JellyfinGenre {
  Id: string;
  Name: string;
}

export interface JellyfinGenresResponse {
  Items: JellyfinGenre[];
}

export interface JellyfinMediaStream {
  Type: string;
  Codec: string;
  Index?: number;
  Language?: string;
  DisplayTitle?: string;
  IsDefault?: boolean;
  IsForced?: boolean;
}

export interface JellyfinMediaSource {
  Id: string;
  Container: string;
  MediaStreams?: JellyfinMediaStream[];
  TranscodingUrl?: string;
}

export interface SubtitleTrack {
  index: number;
  language: string;
  displayTitle: string;
  codec: string;
  isDefault: boolean;
  isForced: boolean;
}

export interface JellyfinMovieDetails {
  Id: string;
  Name: string;
  ProductionYear?: number;
  RunTimeTicks?: number;
  Overview?: string;
  Genres?: string[];
  ImageTags?: { Primary?: string };
  MediaSources?: JellyfinMediaSource[];
  CommunityRating?: number;
}

export interface JellyfinStreamInfo {
  mediaSourceId: string;
  container: string;
  videoCodec?: string;
  audioCodec?: string;
  transcodingUrl?: string;
}

// Library error types

export type LibraryErrorType = 'network' | 'unauthorized' | 'not-found' | 'unknown';

export class LibraryError extends Error {
  type: LibraryErrorType;
  originalError?: unknown;

  constructor(type: LibraryErrorType, message: string, originalError?: unknown) {
    super(message);
    this.name = 'LibraryError';
    this.type = type;
    this.originalError = originalError;
  }
}
