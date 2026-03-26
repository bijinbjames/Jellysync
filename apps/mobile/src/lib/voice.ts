import { createVoiceStore } from '@jellysync/shared';
import { secureStorage } from './secure-storage';

export const voiceStore = createVoiceStore(secureStorage);
