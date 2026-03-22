import { createAuthStore } from '@jellysync/shared';
import { secureStorage } from './secure-storage';

export const authStore = createAuthStore(secureStorage);
