import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeScreen } from './WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders the component', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    expect(screen.getByText('OpenClack')).toBeInTheDocument();
  });

  it('displays the app title "OpenClack"', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const title = screen.getByText('OpenClack');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H1');
    expect(title).toHaveClass('app-title');
  });

  it('displays the app tagline', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const tagline = screen.getByText('Silent installer for OpenClaw');
    expect(tagline).toBeInTheDocument();
    expect(tagline).toHaveClass('app-tagline');
  });

  it('displays the app description', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const description = screen.getByText(/The easiest way to install OpenClaw/i);
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('app-description');
  });

  it('displays the logo with "OC" text', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const logoIcon = screen.getByText('OC');
    expect(logoIcon).toBeInTheDocument();
    expect(logoIcon).toHaveClass('logo-icon');
  });

  it('renders the install button', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const button = screen.getByRole('button', { name: /install openclaw/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('install-button', 'primary');
  });

  it('calls onInstall when install button is clicked', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

    const button = screen.getByRole('button', { name: /install openclaw/i });
    fireEvent.click(button);

    expect(mockOnInstall).toHaveBeenCalledTimes(1);
  });

  it('disables install button when isInstalling is true', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('changes button text to "Installing..." when isInstalling is true', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={true} />);

    const button = screen.getByRole('button', { name: /installation in progress/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Installing...');
  });

  it('does not call onInstall when button is disabled', () => {
    const mockOnInstall = vi.fn();
    render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={true} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnInstall).not.toHaveBeenCalled();
  });

  it('has the welcome-screen container', () => {
    const mockOnInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />
    );

    const welcomeScreen = container.querySelector('.welcome-screen');
    expect(welcomeScreen).toBeInTheDocument();
  });

  it('has the welcome-content container', () => {
    const mockOnInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />
    );

    const welcomeContent = container.querySelector('.welcome-content');
    expect(welcomeContent).toBeInTheDocument();
  });

  it('has the logo-container', () => {
    const mockOnInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />
    );

    const logoContainer = container.querySelector('.logo-container');
    expect(logoContainer).toBeInTheDocument();
  });

  it('has the logo element', () => {
    const mockOnInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />
    );

    const logo = container.querySelector('.logo');
    expect(logo).toBeInTheDocument();
  });

  it('has proper component structure hierarchy', () => {
    const mockOnInstall = vi.fn();
    const { container } = render(
      <WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />
    );

    const welcomeScreen = container.querySelector('.welcome-screen');
    const welcomeContent = welcomeScreen?.querySelector('.welcome-content');
    const logoContainer = welcomeContent?.querySelector('.logo-container');
    const logo = logoContainer?.querySelector('.logo');
    const logoIcon = logo?.querySelector('.logo-icon');

    expect(welcomeScreen).toBeInTheDocument();
    expect(welcomeContent).toBeInTheDocument();
    expect(logoContainer).toBeInTheDocument();
    expect(logo).toBeInTheDocument();
    expect(logoIcon).toBeInTheDocument();
  });

  describe('Settings Button', () => {
    it('does not render settings button when onSettings is not provided', () => {
      const mockOnInstall = vi.fn();
      render(<WelcomeScreen onInstall={mockOnInstall} isInstalling={false} />);

      const settingsButton = screen.queryByText('Configure API Keys');
      expect(settingsButton).not.toBeInTheDocument();
    });

    it('renders settings button when onSettings is provided', () => {
      const mockOnInstall = vi.fn();
      const mockOnSettings = vi.fn();
      render(
        <WelcomeScreen
          onInstall={mockOnInstall}
          isInstalling={false}
          onSettings={mockOnSettings}
        />
      );

      const settingsButton = screen.getByRole('button', {
        name: /configure api keys/i,
      });
      expect(settingsButton).toBeInTheDocument();
      expect(settingsButton).toHaveClass('settings-button', 'secondary');
    });

    it('calls onSettings when settings button is clicked', () => {
      const mockOnInstall = vi.fn();
      const mockOnSettings = vi.fn();
      render(
        <WelcomeScreen
          onInstall={mockOnInstall}
          isInstalling={false}
          onSettings={mockOnSettings}
        />
      );

      const settingsButton = screen.getByRole('button', {
        name: /configure api keys/i,
      });
      fireEvent.click(settingsButton);

      expect(mockOnSettings).toHaveBeenCalledTimes(1);
    });

    it('disables settings button when isInstalling is true', () => {
      const mockOnInstall = vi.fn();
      const mockOnSettings = vi.fn();
      render(
        <WelcomeScreen
          onInstall={mockOnInstall}
          isInstalling={true}
          onSettings={mockOnSettings}
        />
      );

      const settingsButton = screen.getByRole('button', {
        name: /configure api keys/i,
      });
      expect(settingsButton).toBeDisabled();
    });

    it('does not call onSettings when button is disabled', () => {
      const mockOnInstall = vi.fn();
      const mockOnSettings = vi.fn();
      render(
        <WelcomeScreen
          onInstall={mockOnInstall}
          isInstalling={true}
          onSettings={mockOnSettings}
        />
      );

      const settingsButton = screen.getByRole('button', {
        name: /configure api keys/i,
      });
      fireEvent.click(settingsButton);

      expect(mockOnSettings).not.toHaveBeenCalled();
    });
  });
});
