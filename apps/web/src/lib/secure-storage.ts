import type { StateStorage } from 'zustand/middleware';

const PREFIX = 'jellysync_';

export const secureStorage: StateStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(`${PREFIX}${name}`) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(`${PREFIX}${name}`, value);
    } catch {
      // Quota exceeded or storage blocked — session won't persist
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(`${PREFIX}${name}`);
    } catch {
      // Storage blocked
    }
  },
};
