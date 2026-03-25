import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SwapConfirmSheet } from './swap-confirm-sheet.js';

describe('SwapConfirmSheet', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    movieName: 'The Matrix',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    visible: true,
  };

  it('renders movie name when visible', () => {
    render(<SwapConfirmSheet {...defaultProps} />);
    expect(screen.getByText(/The Matrix/)).toBeInTheDocument();
  });

  it('renders nothing when not visible', () => {
    const { container } = render(<SwapConfirmSheet {...defaultProps} visible={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onConfirm when Change Movie button is clicked', () => {
    const onConfirm = vi.fn();
    render(<SwapConfirmSheet {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByLabelText('Change Movie'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<SwapConfirmSheet {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByLabelText('Cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', () => {
    const onCancel = vi.fn();
    const { container } = render(<SwapConfirmSheet {...defaultProps} onCancel={onCancel} />);
    // Backdrop is the aria-hidden div inside the dialog wrapper
    const backdrop = container.querySelector('[aria-hidden="true"]')!;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    const onCancel = vi.fn();
    render(<SwapConfirmSheet {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
