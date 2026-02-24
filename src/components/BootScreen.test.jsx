import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import BootScreen from '../components/BootScreen';

describe('BootScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the boot screen container', () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    expect(document.querySelector('.boot-screen')).toBeInTheDocument();
  });

  it('shows the blinking cursor initially', () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    expect(document.querySelector('.cursor-blink')).toBeInTheDocument();
  });

  it('shows the first boot line after initial render', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    // delay 0 timer fires when timers are advanced
    await act(async () => { vi.advanceTimersByTime(10); });
    expect(screen.getByText(/myMatrix.*terminal client/i)).toBeInTheDocument();
  });

  it('reveals more lines as time advances', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);

    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getByText('Initializing Matrix Client...')).toBeInTheDocument();

    await act(async () => { vi.advanceTimersByTime(600); });
    expect(screen.getByText('Setting up event listeners...')).toBeInTheDocument();
  });

  it('shows "Press any key or wait..." after 3800ms', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    await act(async () => { vi.advanceTimersByTime(3800); });
    expect(screen.getByText('Press any key or wait...')).toBeInTheDocument();
  });

  it('calls onDone after 4200ms', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(4200); });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('clears timers on unmount without calling onDone', async () => {
    const onDone = vi.fn();
    const { unmount } = render(<BootScreen onDone={onDone} />);
    await act(async () => { vi.advanceTimersByTime(2000); });
    unmount();
    await act(async () => { vi.advanceTimersByTime(5000); });
    // onDone should not be called after unmount
    expect(onDone).not.toHaveBeenCalled();
  });

  it('shows [  OK  ] lines with boot-ok class', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    await act(async () => { vi.advanceTimersByTime(2500); });
    const okLines = document.querySelectorAll('.boot-ok');
    expect(okLines.length).toBeGreaterThan(0);
    expect(okLines[0].textContent).toContain('OK');
  });

  it('shows "Sync complete." with boot-sync class', async () => {
    const onDone = vi.fn();
    render(<BootScreen onDone={onDone} />);
    await act(async () => { vi.advanceTimersByTime(3000); });
    const syncLine = screen.getByText('Sync complete.');
    expect(syncLine).toHaveClass('boot-sync');
  });
});
