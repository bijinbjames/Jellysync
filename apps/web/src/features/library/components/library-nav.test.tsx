import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LibraryNav } from './library-nav.js';

describe('LibraryNav', () => {
  it('renders all 4 tabs', () => {
    render(<LibraryNav />);
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Rooms')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('marks Discover as active with aria-current="page"', () => {
    render(<LibraryNav />);
    const discoverTab = screen.getByText('Discover').closest('button');
    expect(discoverTab).toHaveAttribute('aria-current', 'page');
  });

  it('does not mark other tabs as active', () => {
    render(<LibraryNav />);
    const roomsTab = screen.getByText('Rooms').closest('button');
    const watchlistTab = screen.getByText('Watchlist').closest('button');
    const settingsTab = screen.getByText('Settings').closest('button');
    expect(roomsTab).not.toHaveAttribute('aria-current');
    expect(watchlistTab).not.toHaveAttribute('aria-current');
    expect(settingsTab).not.toHaveAttribute('aria-current');
  });

  it('applies lg:hidden class to nav container', () => {
    render(<LibraryNav />);
    const nav = screen.getByRole('navigation', { name: 'Browse navigation' });
    expect(nav).toHaveClass('lg:hidden');
  });
});
