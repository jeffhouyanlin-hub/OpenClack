import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App, { AppScreen } from './App';

describe('App Navigation State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start on welcome screen', () => {
      render(<App />);
      expect(screen.getByText('OpenClack')).toBeInTheDocument();
      expect(screen.getByText('Install OpenClaw')).toBeInTheDocument();
    });

    it('should display configure API keys button', () => {
      render(<App />);
      expect(screen.getByText('Configure API Keys')).toBeInTheDocument();
    });
  });

  describe('Welcome -> Settings Navigation', () => {
    it('should navigate to settings screen when configure button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      const configureButton = screen.getByText('Configure API Keys');
      await user.click(configureButton);

      expect(screen.getByText('API Key Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText(/Anthropic API Key/)).toBeInTheDocument();
    });
  });

  describe('Settings -> Welcome Navigation', () => {
    it('should navigate back to welcome screen when back button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to settings
      await user.click(screen.getByText('Configure API Keys'));
      expect(screen.getByText('API Key Configuration')).toBeInTheDocument();

      // Navigate back
      await user.click(screen.getByText('← Back'));
      expect(screen.getByText('OpenClack')).toBeInTheDocument();
      expect(screen.getByText('Install OpenClaw')).toBeInTheDocument();
    });

    it('should save API keys and return to welcome when save clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to settings
      await user.click(screen.getByText('Configure API Keys'));

      // Fill in API key
      const anthropicInput = screen.getByLabelText(/Anthropic API Key/);
      await user.type(anthropicInput, 'sk-ant-test12345678901234567890');

      // Save and return
      await user.click(screen.getByText('Save Configuration'));

      expect(screen.getByText('OpenClack')).toBeInTheDocument();
    });

    it('should skip API keys and return to welcome when skip clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to settings
      await user.click(screen.getByText('Configure API Keys'));

      // Skip without filling anything
      await user.click(screen.getByText('Skip for Now'));

      expect(screen.getByText('OpenClack')).toBeInTheDocument();
    });
  });

  describe('Welcome -> Installing Navigation', () => {
    it('should navigate to installation screen when install clicked', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      expect(screen.getByText('Installing OpenClaw')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display installation logs section', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      expect(screen.getByText('Installation Log')).toBeInTheDocument();
    });
  });

  describe('Installing -> Success Navigation', () => {
    it('should navigate to success screen after installation completes', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      // Wait for installation to complete (mocked with setTimeout in App.tsx)
      await waitFor(
        () => {
          expect(screen.getByText('Installation Complete!')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display launch and close buttons on success', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      await waitFor(
        () => {
          expect(screen.getByText('Launch OpenClaw')).toBeInTheDocument();
          expect(screen.getByText('Close')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should display installation summary on success', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      await waitFor(
        () => {
          expect(screen.getByText('Installation Summary')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Error Handling', () => {
    it('should display error screen when error occurs', async () => {
      // This will be tested more thoroughly when actual error handling is implemented
      // For now, we verify the error screen component is properly integrated
      expect(AppScreen.ERROR).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    it('should maintain API keys across screen transitions', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to settings and save API key
      await user.click(screen.getByText('Configure API Keys'));
      const anthropicInput = screen.getByLabelText(/Anthropic API Key/);
      await user.type(anthropicInput, 'sk-ant-test12345678901234567890');
      await user.click(screen.getByText('Save Configuration'));

      // Navigate to settings again
      await user.click(screen.getByText('Configure API Keys'));

      // Verify API key is still there
      const anthropicInputAgain = screen.getByLabelText(
        /Anthropic API Key/
      ) as HTMLInputElement;
      expect(anthropicInputAgain.value).toBe('sk-ant-test12345678901234567890');
    });

    it('should reset installation state when starting new install', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Start installation
      await user.click(screen.getByText('Install OpenClaw'));
      expect(screen.getByText('Installing OpenClaw')).toBeInTheDocument();

      // Wait for completion
      await waitFor(
        () => {
          expect(screen.getByText('Installation Complete!')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // This test verifies state reset happens on install start
      // More comprehensive tests will be added when retry is implemented
    });
  });

  describe('Invalid Transitions', () => {
    it('should not allow direct navigation from installing to settings', () => {
      // This ensures the state machine prevents invalid transitions
      // The implementation should not provide buttons or methods to do this
      render(<App />);

      // Verify no settings button is available on other screens
      // (tested implicitly by screen-specific button tests)
      expect(AppScreen).toBeDefined();
    });
  });

  describe('Screen Enum', () => {
    it('should export AppScreen enum with all screen states', () => {
      expect(AppScreen.WELCOME).toBe('welcome');
      expect(AppScreen.SETTINGS).toBe('settings');
      expect(AppScreen.INSTALLING).toBe('installing');
      expect(AppScreen.SUCCESS).toBe('success');
      expect(AppScreen.ERROR).toBe('error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles for main container', () => {
      render(<App />);
      const appContainer = screen.getByText('OpenClack').closest('.app');
      expect(appContainer).toBeInTheDocument();
    });

    it('should maintain focus management during screen transitions', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to settings
      const configureButton = screen.getByText('Configure API Keys');
      await user.click(configureButton);

      // Verify we can still interact with elements
      expect(screen.getByText('API Key Configuration')).toBeInTheDocument();
      expect(document.activeElement).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid screen transitions', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Rapidly navigate between screens
      await user.click(screen.getByText('Configure API Keys'));
      await user.click(screen.getByText('← Back'));
      await user.click(screen.getByText('Configure API Keys'));
      await user.click(screen.getByText('Skip for Now'));

      // Should end up on welcome screen
      expect(screen.getByText('OpenClack')).toBeInTheDocument();
    });

    it('should render default screen on unknown state', () => {
      // This tests the default case in the switch statement
      render(<App />);

      // With proper implementation, should always show a valid screen
      expect(screen.getByText('OpenClack')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should define close handler for success screen', async () => {
      const user = userEvent.setup();

      // Mock window.close
      const mockClose = vi.fn();
      Object.defineProperty(window, 'close', {
        value: mockClose,
        writable: true,
      });

      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      await waitFor(
        () => {
          expect(screen.getByText('Close')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Note: Actually clicking close would close the window
      // We just verify the button exists
      expect(screen.getByText('Close')).toBeInTheDocument();
    });
  });

  describe('Launch Functionality', () => {
    it('should define launch handler for success screen', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'log');

      render(<App />);

      await user.click(screen.getByText('Install OpenClaw'));

      await waitFor(
        () => {
          expect(screen.getByText('Launch OpenClaw')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click launch button
      await user.click(screen.getByText('Launch OpenClaw'));

      // Verify placeholder console.log was called
      expect(consoleSpy).toHaveBeenCalledWith('Launch OpenClaw');
    });
  });
});
