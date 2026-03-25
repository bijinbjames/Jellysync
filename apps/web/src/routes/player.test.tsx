import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PlayerPage from './player.js';
import { movieStore } from '../lib/movie.js';
import { roomStore } from '../lib/room.js';
import { authStore } from '../lib/auth.js';

vi.mock('../features/player', () => ({
  useHtmlVideo: () => ({
    videoRef: { current: null },
    playerInterface: {
      play: vi.fn(),
      pause: vi.fn(),
      seek: vi.fn(),
      getPosition: vi.fn(() => 0),
      getBufferState: vi.fn(() => ({ isBuffering: false, bufferedMs: 0 })),
    },
  }),
  HtmlVideoPlayer: ({ streamUrl }: { streamUrl: string }) => (
    <div data-testid="html-video-player" data-stream-url={streamUrl} />
  ),
}));

function renderPlayer() {
  return render(
    <MemoryRouter initialEntries={['/player']}>
      <Routes>
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/" element={<div data-testid="home" />} />
      </Routes>
    </MemoryRouter>,
  );
}

function setupAuthState() {
  authStore.setState({ serverUrl: 'http://localhost:8096', token: 'test-token' });
}

describe('PlayerPage', () => {
  beforeEach(() => {
    movieStore.getState().clearMovie();
    roomStore.getState().clearRoom();
    setupAuthState();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders video player with correct stream URL when movie is selected', () => {
    movieStore.getState().setMovie({ id: 'movie-1', name: 'Test Movie' });
    renderPlayer();
    const player = screen.getByTestId('html-video-player');
    expect(player).toBeInTheDocument();
    expect(player.dataset.streamUrl).toContain('movie-1');
  });

  it('shows Change Movie button when user is host', () => {
    movieStore.getState().setMovie({ id: 'movie-1', name: 'Test Movie' });
    roomStore.getState().setParticipantId('host-1');
    roomStore.getState().setRoom('ABC123', 'host-1', [
      { id: 'host-1', displayName: 'Host', isHost: true, joinedAt: Date.now() },
    ]);
    renderPlayer();
    expect(screen.getByLabelText('Change Movie')).toBeInTheDocument();
  });

  it('hides Change Movie button when user is not host', () => {
    movieStore.getState().setMovie({ id: 'movie-1', name: 'Test Movie' });
    roomStore.getState().setParticipantId('guest-1');
    roomStore.getState().setRoom('ABC123', 'host-1', [
      { id: 'host-1', displayName: 'Host', isHost: true, joinedAt: Date.now() },
      { id: 'guest-1', displayName: 'Guest', isHost: false, joinedAt: Date.now() },
    ]);
    renderPlayer();
    expect(screen.queryByLabelText('Change Movie')).not.toBeInTheDocument();
  });

  it('redirects to home when no movie selected', () => {
    renderPlayer();
    expect(screen.getByTestId('home')).toBeInTheDocument();
  });

  it('shows Back to Lobby button for all users', () => {
    movieStore.getState().setMovie({ id: 'movie-1', name: 'Test Movie' });
    roomStore.getState().setParticipantId('guest-1');
    roomStore.getState().setRoom('ABC123', 'host-1', [
      { id: 'host-1', displayName: 'Host', isHost: true, joinedAt: Date.now() },
      { id: 'guest-1', displayName: 'Guest', isHost: false, joinedAt: Date.now() },
    ]);
    renderPlayer();
    expect(screen.getByLabelText('Back to lobby')).toBeInTheDocument();
  });
});
