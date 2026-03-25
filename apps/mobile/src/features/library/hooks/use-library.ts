import { useStore } from 'zustand';
import { useLibrary as useLibraryShared } from '@jellysync/shared';
import { authStore } from '../../../lib/auth';

export function useLibrary() {
  const serverUrl = useStore(authStore, (s) => s.serverUrl);
  const token = useStore(authStore, (s) => s.token);
  const userId = useStore(authStore, (s) => s.userId);

  return useLibraryShared(serverUrl ?? '', token ?? '', userId ?? '');
}
