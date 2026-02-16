/**
 * feat-060: Keyboard shortcuts test
 * feat-061: Accessibility test
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen - Keyboard Shortcuts (feat-060)', () => {
  it('should call onInstall when Enter key is pressed', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={false} />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onInstall).toHaveBeenCalledTimes(1);
  });

  it('should not call onInstall on Enter when isInstalling is true', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={true} />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onInstall).not.toHaveBeenCalled();
  });

  it('should not call onInstall on other keys', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={false} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.keyDown(window, { key: 'Space' });
    fireEvent.keyDown(window, { key: 'a' });

    expect(onInstall).not.toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    const onInstall = vi.fn();
    const { unmount } = render(
      <WelcomeScreen onInstall={onInstall} isInstalling={false} />
    );

    unmount();

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onInstall).not.toHaveBeenCalled();
  });
});

describe('WelcomeScreen - Accessibility (feat-061)', () => {
  it('should have role="main" on welcome screen', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={false} />);

    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should have aria-label on welcome screen', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={false} />);

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('aria-label', 'Welcome screen');
  });

  it('should have aria-hidden on decorative logo', () => {
    const onInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={onInstall} isInstalling={false} />
    );

    const logo = container.querySelector('.logo');
    expect(logo).toHaveAttribute('aria-hidden', 'true');
  });

  it('should have descriptive aria-label on install button', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={false} />);

    const button = screen.getByRole('button', { name: 'Install OpenClaw' });
    expect(button).toBeInTheDocument();
  });

  it('should update aria-label when installing', () => {
    const onInstall = vi.fn();
    render(<WelcomeScreen onInstall={onInstall} isInstalling={true} />);

    const button = screen.getByRole('button', { name: 'Installation in progress' });
    expect(button).toBeInTheDocument();
  });

  it('should have aria-label on settings button', () => {
    const onInstall = vi.fn();
    const onSettings = vi.fn();
    render(
      <WelcomeScreen
        onInstall={onInstall}
        isInstalling={false}
        onSettings={onSettings}
      />
    );

    const settingsButton = screen.getByRole('button', { name: 'Configure API Keys' });
    expect(settingsButton).toBeInTheDocument();
  });
});
