import { describe, it, expect, beforeEach } from 'vitest';
import { createMovieStore, type MovieStoreInstance, type SelectedMovie } from './movie-store.js';

describe('movieStore', () => {
  let store: MovieStoreInstance;

  const testMovie: SelectedMovie = {
    id: 'movie-1',
    name: 'Test Movie',
    year: 2024,
    runtimeTicks: 72_000_000_000,
    imageTag: 'abc123',
  };

  beforeEach(() => {
    store = createMovieStore();
  });

  describe('initial state', () => {
    it('has null selectedMovie', () => {
      expect(store.getState().selectedMovie).toBeNull();
    });
  });

  describe('setMovie', () => {
    it('sets the selected movie', () => {
      store.getState().setMovie(testMovie);
      expect(store.getState().selectedMovie).toEqual(testMovie);
    });

    it('replaces previously selected movie', () => {
      store.getState().setMovie(testMovie);
      const anotherMovie: SelectedMovie = { id: 'movie-2', name: 'Another Movie' };
      store.getState().setMovie(anotherMovie);
      expect(store.getState().selectedMovie).toEqual(anotherMovie);
    });

    it('handles movie with only required fields', () => {
      const minimalMovie: SelectedMovie = { id: 'movie-3', name: 'Minimal' };
      store.getState().setMovie(minimalMovie);
      const selected = store.getState().selectedMovie;
      expect(selected?.id).toBe('movie-3');
      expect(selected?.name).toBe('Minimal');
      expect(selected?.year).toBeUndefined();
      expect(selected?.runtimeTicks).toBeUndefined();
      expect(selected?.imageTag).toBeUndefined();
    });
  });

  describe('clearMovie', () => {
    it('clears the selected movie', () => {
      store.getState().setMovie(testMovie);
      store.getState().clearMovie();
      expect(store.getState().selectedMovie).toBeNull();
    });

    it('is a no-op when already null', () => {
      store.getState().clearMovie();
      expect(store.getState().selectedMovie).toBeNull();
    });
  });
});
