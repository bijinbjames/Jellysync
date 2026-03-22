import { createStore } from 'zustand/vanilla';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import { authenticateWithJellyfin } from '../jellyfin/auth.js';
import { AuthError } from '../jellyfin/types.js';

export interface AuthState {
  serverUrl: string | null;
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
  errorField: 'server' | 'credentials' | null;
}

export interface AuthActions {
  login: (serverUrl: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  serverUrl: null,
  token: null,
  userId: null,
  username: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
  error: null,
  errorField: null,
};

export function createAuthStore(storage: StateStorage) {
  let loginRequestId = 0;
  let storeSet: ((partial: Partial<AuthStore>) => void) | null = null;

  return createStore<AuthStore>()(
    persist(
      (set) => {
        storeSet = set as (partial: Partial<AuthStore>) => void;
        return {
          ...initialState,

          login: async (serverUrl: string, username: string, password: string) => {
            const currentRequestId = ++loginRequestId;
            set({ isLoading: true, error: null, errorField: null });
            try {
              const result = await authenticateWithJellyfin(serverUrl, username, password);
              if (currentRequestId !== loginRequestId) return;
              set({
                serverUrl: result.serverUrl,
                token: result.token,
                userId: result.userId,
                username: result.username,
                isAuthenticated: true,
                isLoading: false,
                error: null,
                errorField: null,
              });
            } catch (err: unknown) {
              if (currentRequestId !== loginRequestId) return;
              if (err instanceof AuthError) {
                const errorField = err.type === 'network' || err.type === 'timeout' || err.type === 'unknown' ? 'server' : 'credentials';
                set({ isLoading: false, error: err.message, errorField });
              } else {
                set({ isLoading: false, error: 'Something went wrong — try again', errorField: 'server' });
              }
              throw err;
            }
          },

          logout: () => {
            loginRequestId++;
            set({
              serverUrl: null,
              token: null,
              userId: null,
              username: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              errorField: null,
            });
          },

          setHydrated: (hydrated: boolean) => {
            set({ isHydrated: hydrated });
          },

          clearError: () => {
            set({ error: null, errorField: null });
          },
        };
      },
      {
        name: 'jellysync-auth',
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          serverUrl: state.serverUrl,
          token: state.token,
          userId: state.userId,
          username: state.username,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (_state, error) => {
          if (error) {
            console.warn('Auth store rehydration failed:', error);
          }
          if (_state) {
            _state.setHydrated(true);
          } else if (storeSet) {
            storeSet({ isHydrated: true });
          }
        },
      },
    ),
  );
}

export type AuthStoreInstance = ReturnType<typeof createAuthStore>;
