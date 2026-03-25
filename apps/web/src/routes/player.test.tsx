import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PlayerPage from './player.js';
import { movieStore } from '../lib/movie.js';
import { roomStore } from '../lib/room.js';

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

describe('PlayerPage', () => {
  beforeEach(() => {
    movieStore.getState().clearMovie();
    roomStore.getState().clearRoom();
  });

  afterEach(() => {
    cleanup();
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
});
