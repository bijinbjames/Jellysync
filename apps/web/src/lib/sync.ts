import { createSyncStore } from '@jellysync/shared';
import { secureStorage } from './secure-storage';

export const syncStore = createSyncStore(secureStorage);
