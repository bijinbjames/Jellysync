import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MicToggleFAB } from './mic-toggle-fab.js';

describe('MicToggleFAB', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders live state when not muted', () => {
    render(<MicToggleFAB isMuted={false} onToggle={() => {}} />);
    const button = screen.getByRole('switch');
    expect(button).toBeTruthy();
    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Microphone on');
    expect(screen.queryByText('MIC MUTED')).toBeNull();
  });

  it('renders muted state with MIC MUTED label', () => {
    render(<MicToggleFAB isMuted={true} onToggle={() => {}} />);
    const button = screen.getByRole('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Microphone muted');
    expect(screen.getByText('MIC MUTED')).toBeTruthy();
  });

  it('calls onToggle when clicked', () => {
    let toggled = false;
    render(<MicToggleFAB isMuted={false} onToggle={() => { toggled = true; }} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(toggled).toBe(true);
  });

  it('has correct opacity for live state (low visibility)', () => {
    render(<MicToggleFAB isMuted={false} onToggle={() => {}} />);
    const button = screen.getByRole('switch');
    expect(button.style.opacity).toBe('0.4');
  });

  it('has correct opacity for muted state (more visible)', () => {
    render(<MicToggleFAB isMuted={true} onToggle={() => {}} />);
    const button = screen.getByRole('switch');
    expect(button.style.opacity).toBe('0.6');
  });
});
