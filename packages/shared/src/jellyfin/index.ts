export { authenticateWithJellyfin } from './auth.js';
export { makeRequest, buildAuthHeader } from './client.js';
export {
  fetchMovieList,
  fetchMovieDetails,
  fetchLibraryCategories,
  getImageUrl,
  formatRuntime,
  type FetchMovieListOptions,
  type ImageUrlOptions,
} from './library.js';
export { buildStreamUrl, extractSubtitleTracks, getSubtitleUrl, type StreamUrlOptions } from './streaming.js';
export { useMovieList, useMovieDetails, useLibraryCategories } from './hooks.js';
export { useLibrary, RECENTLY_ADDED_CATEGORY, type UseLibraryResult } from './use-library.js';
export {
  AuthError,
  LibraryError,
  type AuthCredentials,
  type AuthResult,
  type AuthErrorType,
  type JellyfinAuthResponse,
  type JellyfinUserInfo,
  type JellyfinLibraryItem,
  type JellyfinLibraryResponse,
  type JellyfinGenre,
  type JellyfinGenresResponse,
  type JellyfinMovieDetails,
  type JellyfinMediaSource,
  type JellyfinStreamInfo,
  type JellyfinMediaStream,
  type SubtitleTrack,
  type LibraryErrorType,
} from './types.js';
