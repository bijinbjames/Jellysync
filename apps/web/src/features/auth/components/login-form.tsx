import { useState, type FormEvent } from 'react';
import { useStore } from 'zustand';
import { authStore } from '../../../lib/auth';
import { ServerUrlInput } from './server-url-input';

export function LoginForm() {
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isLoading = useStore(authStore, (s) => s.isLoading);
  const error = useStore(authStore, (s) => s.error);
  const errorField = useStore(authStore, (s) => s.errorField);
  const login = useStore(authStore, (s) => s.login);
  const clearError = useStore(authStore, (s) => s.clearError);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !username.trim() || !password.trim()) return;
    clearError();
    try {
      await login(serverUrl.trim(), username.trim(), password);
    } catch {
      // Error is handled in the store
    }
  };

  const serverError = errorField === 'server' ? error : null;
  const credentialsError = errorField === 'credentials' ? error : null;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-primary font-display text-4xl font-extrabold">
          JellySync
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-lg p-6">
        <ServerUrlInput
          value={serverUrl}
          onChange={(val) => {
            setServerUrl(val);
            if (error) clearError();
          }}
          error={serverError}
        />

        <div className="w-full mb-4">
          <label className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5 block">
            Username
          </label>
          <div className="flex items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3 focus-within:ring-2 focus-within:ring-primary">
            <span className="text-on-surface-variant mr-2 text-base">👤</span>
            <input
              type="text"
              className="flex-1 bg-transparent text-on-surface font-body text-base py-3 outline-none placeholder:text-outline"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) clearError();
              }}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>
        </div>

        <div className="w-full mb-6">
          <label className="text-secondary text-xs font-body uppercase tracking-widest mb-1.5 block">
            Password
          </label>
          <div className="flex items-center bg-surface-container-lowest rounded-md min-h-[48px] px-3 focus-within:ring-2 focus-within:ring-primary">
            <span className="text-on-surface-variant mr-2 text-base">🔒</span>
            <input
              type="password"
              className="flex-1 bg-transparent text-on-surface font-body text-base py-3 outline-none placeholder:text-outline"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="Password"
              autoComplete="current-password"
            />
          </div>
          {credentialsError && (
            <p className="text-error text-sm font-body mt-1">{credentialsError}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full gradient-primary rounded-md min-h-[48px] flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="text-surface font-display text-base font-bold animate-pulse">
              Connecting...
            </span>
          ) : (
            <span className="text-surface font-display text-base font-bold">
              Connect
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
