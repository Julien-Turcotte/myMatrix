import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WelcomePanel from '../components/WelcomePanel';

function makeRoom(id, name = 'General') {
  return { roomId: id, name };
}

describe('WelcomePanel', () => {
  it('renders the welcome panel container', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(document.querySelector('.welcome-panel')).toBeInTheDocument();
  });

  it('displays username@server from currentUserId', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(screen.getByText('alice@matrix.org')).toBeInTheDocument();
  });

  it('shows the rooms count', () => {
    const rooms = [makeRoom('!r1:m.org'), makeRoom('!r2:m.org')];
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={rooms} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows client label', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(screen.getByText('Client')).toBeInTheDocument();
  });

  it('shows protocol label', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(screen.getByText('Protocol')).toBeInTheDocument();
    expect(screen.getByText('Matrix')).toBeInTheDocument();
  });

  it('shows Ctrl+K hint', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(screen.getByText(/Ctrl\+K/)).toBeInTheDocument();
  });

  it('renders logo with neofetch ASCII art', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(document.querySelector('.welcome-logo')).toBeInTheDocument();
  });

  it('renders color swatches', () => {
    render(<WelcomePanel currentUserId="@alice:matrix.org" rooms={[]} />);
    expect(document.querySelectorAll('.welcome-color-block').length).toBeGreaterThan(0);
  });

  it('falls back to guest@matrix when no userId', () => {
    render(<WelcomePanel currentUserId="" rooms={[]} />);
    expect(screen.getByText('guest@matrix')).toBeInTheDocument();
  });
});
