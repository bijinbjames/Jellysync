import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import LibraryPage from './library.js';
import { movieStore } from '../lib/movie.js';
import { roomStore } from '../lib/room.js';

const mockSend = vi.fn();
const mockSubscribe = vi.fn(() => vi.fn());
vi.mock('../shared/providers/websocket-provider', () => ({
  useWs: () => ({ send: mockSend, subscribe: mockSubscribe }),
}));

vi.mock('../features/library/hooks/use-library', () => ({
  useLibrary: () => ({
    movies: [
      { Id: 'movie-1', Name: 'Test Movie', ProductionYear: 2024, RunTimeTicks: 72e9, ImageTags: { Primary: 'tag1' } },
      { Id: 'movie-2', Name: 'Another Movie', ProductionYear: 2023, RunTimeTicks: 54e9, ImageTags: {} },
    ],
    categories: [],
    selectedCategory: null,
    setCategory: vi.fn(),
    isLoading: false,
    error: null,
    serverUrl: 'http://localhost:8096',
  }),
}));

vi.mock('../features/library/components/poster-grid', () => ({
  PosterGrid: ({ onMoviePress, movies }: any) => (
    <div data-testid="poster-grid">
      {movies.map((m: any) => (
        <button key={m.Id} onClick={() => onMoviePress(m)} data-testid={`poster-${m.Id}`}>
          {m.Name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../features/library/components/category-chips', () => ({
  CategoryChips: () => <div data-testid="category-chips" />,
}));

vi.mock('../shared/components/glass-header', () => ({
  GlassHeader: () => <div data-testid="glass-header" />,
}));

function renderWithRouter(initialEntries: string[] = ['/library']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/room/:code" element={<div data-testid="lobby" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LibraryPage swap flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    movieStore.getState().clearMovie();
    roomStore.getState().clearRoom();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows confirmation sheet when from=lobby and poster is tapped', () => {
    renderWithRouter(['/library?from=lobby']);
    fireEvent.click(screen.getByTestId('poster-movie-1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Change to/)).toBeInTheDocument();
  });

  it('shows confirmation sheet when from=player and poster is tapped', () => {
    renderWithRouter(['/library?from=player']);
    fireEvent.click(screen.getByTestId('poster-movie-1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does NOT show confirmation sheet when no from param (new room creation)', () => {
    renderWithRouter(['/library']);
    fireEvent.click(screen.getByTestId('poster-movie-1'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dismisses sheet on Cancel', () => {
    renderWithRouter(['/library?from=lobby']);
    fireEvent.click(screen.getByTestId('poster-movie-1'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Cancel'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sends movie:select and updates store on confirm', () => {
    roomStore.getState().setParticipantId('host-1');
    roomStore.getState().setRoom('ABC123', 'host-1', [
      { id: 'host-1', displayName: 'Host', isHost: true, joinedAt: Date.now() },
    ]);
    renderWithRouter(['/library?from=lobby']);
    fireEvent.click(screen.getByTestId('poster-movie-1'));
    fireEvent.click(screen.getByLabelText('Change Movie'));
    expect(movieStore.getState().selectedMovie?.id).toBe('movie-1');
    expect(mockSend).toHaveBeenCalledOnce();
  });
});
