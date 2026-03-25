export { authenticateWithJellyfin } from './auth.js';
export { makeRequest, buildAuthHeader } from './client.js';
export {
  fetchMovieList,
  fetchMovieDetails,
  fetchLibraryCategories,
  getImageUrl,
  type FetchMovieListOptions,
  type ImageUrlOptions,
} from './library.js';
export { buildStreamUrl, type StreamUrlOptions } from './streaming.js';
export { useMovieList, useMovieDetails, useLibraryCategories } from './hooks.js';
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
  type LibraryErrorType,
} from './types.js';
