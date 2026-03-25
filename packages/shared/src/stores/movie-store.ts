import { createStore } from 'zustand/vanilla';

export interface SelectedMovie {
  id: string;
  name: string;
  year?: number;
  runtimeTicks?: number;
  imageTag?: string;
}

export interface MovieState {
  selectedMovie: SelectedMovie | null;
}

export interface MovieActions {
  setMovie: (movie: SelectedMovie) => void;
  clearMovie: () => void;
}

export type MovieStore = MovieState & MovieActions;

export function createMovieStore() {
  return createStore<MovieStore>()((set) => ({
    selectedMovie: null,
    setMovie: (movie) => set({ selectedMovie: movie }),
    clearMovie: () => set({ selectedMovie: null }),
  }));
}

export type MovieStoreInstance = ReturnType<typeof createMovieStore>;
