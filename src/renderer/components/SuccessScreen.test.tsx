import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuccessScreen } from './SuccessScreen';
import type { InstallationSummary } from './SuccessScreen';

describe('SuccessScreen', () => {
  describe('Rendering', () => {
    it('should render the success screen', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
        openclawVersion: '1.0.0',
        configuredApis: ['Anthropic', 'OpenAI'],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Installation Complete!')).toBeInTheDocument();
    });

    it('should display success message', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(
        screen.getByText('OpenClaw has been successfully installed and configured.')
      ).toBeInTheDocument();
    });

    it('should display success icon', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const icon = screen.getByLabelText('Success');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('success-icon');
      expect(icon.textContent).toBe('✓');
    });

    it('should display Installation Summary heading', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Installation Summary')).toBeInTheDocument();
    });

    it('should display Launch OpenClaw button', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const launchButton = screen.getByLabelText('Launch OpenClaw');
      expect(launchButton).toBeInTheDocument();
      expect(launchButton.textContent).toBe('Launch OpenClaw');
    });

    it('should display Close button', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close installer');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.textContent).toBe('Close');
    });
  });

  describe('Installation Summary', () => {
    it('should display Node.js version when provided', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Node.js:')).toBeInTheDocument();
      expect(screen.getByText('v22.12.0')).toBeInTheDocument();
    });

    it('should display OpenClaw version when provided', () => {
      const summary: InstallationSummary = {
        openclawVersion: '1.0.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('OpenClaw:')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });

    it('should display configured APIs when provided', () => {
      const summary: InstallationSummary = {
        configuredApis: ['Anthropic', 'OpenAI', 'Google Gemini'],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Configured APIs:')).toBeInTheDocument();
      expect(screen.getByText('Anthropic, OpenAI, Google Gemini')).toBeInTheDocument();
    });

    it('should display all summary items when all data provided', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
        openclawVersion: '1.0.0',
        configuredApis: ['Anthropic', 'OpenAI'],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Node.js:')).toBeInTheDocument();
      expect(screen.getByText('v22.12.0')).toBeInTheDocument();
      expect(screen.getByText('OpenClaw:')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Configured APIs:')).toBeInTheDocument();
      expect(screen.getByText('Anthropic, OpenAI')).toBeInTheDocument();
    });

    it('should not display Node.js version when not provided', () => {
      const summary: InstallationSummary = {
        openclawVersion: '1.0.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.queryByText('Node.js:')).not.toBeInTheDocument();
    });

    it('should not display OpenClaw version when not provided', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.queryByText('OpenClaw:')).not.toBeInTheDocument();
    });

    it('should not display configured APIs when empty array', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
        configuredApis: [],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.queryByText('Configured APIs:')).not.toBeInTheDocument();
    });

    it('should not display configured APIs when not provided', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.queryByText('Configured APIs:')).not.toBeInTheDocument();
    });

    it('should handle empty summary object', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Installation Summary')).toBeInTheDocument();
      expect(screen.queryByText('Node.js:')).not.toBeInTheDocument();
      expect(screen.queryByText('OpenClaw:')).not.toBeInTheDocument();
      expect(screen.queryByText('Configured APIs:')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onLaunch when Launch button is clicked', async () => {
      const user = userEvent.setup();
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const launchButton = screen.getByLabelText('Launch OpenClaw');
      await user.click(launchButton);

      expect(onLaunch).toHaveBeenCalledTimes(1);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when Close button is clicked', async () => {
      const user = userEvent.setup();
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close installer');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onLaunch).not.toHaveBeenCalled();
    });

    it('should handle multiple Launch button clicks', async () => {
      const user = userEvent.setup();
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const launchButton = screen.getByLabelText('Launch OpenClaw');
      await user.click(launchButton);
      await user.click(launchButton);
      await user.click(launchButton);

      expect(onLaunch).toHaveBeenCalledTimes(3);
    });
  });

  describe('CSS Classes and DOM Structure', () => {
    it('should apply correct CSS classes', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />
      );

      expect(container.querySelector('.success-screen')).toBeInTheDocument();
      expect(container.querySelector('.success-content')).toBeInTheDocument();
      expect(container.querySelector('.success-icon')).toBeInTheDocument();
      expect(container.querySelector('.success-title')).toBeInTheDocument();
      expect(container.querySelector('.success-message')).toBeInTheDocument();
      expect(container.querySelector('.installation-summary')).toBeInTheDocument();
      expect(container.querySelector('.success-actions')).toBeInTheDocument();
    });

    it('should apply btn-primary class to Launch button', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const launchButton = screen.getByLabelText('Launch OpenClaw');
      expect(launchButton).toHaveClass('btn-primary');
    });

    it('should apply btn-secondary class to Close button', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close installer');
      expect(closeButton).toHaveClass('btn-secondary');
    });

    it('should apply summary-item class to each summary entry', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
        openclawVersion: '1.0.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />
      );

      const summaryItems = container.querySelectorAll('.summary-item');
      expect(summaryItems).toHaveLength(2);
    });

    it('should apply summary-label and summary-value classes', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      const { container } = render(
        <SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />
      );

      expect(container.querySelector('.summary-label')).toBeInTheDocument();
      expect(container.querySelector('.summary-value')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have ARIA labels on buttons', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const launchButton = screen.getByLabelText('Launch OpenClaw');
      const closeButton = screen.getByLabelText('Close installer');

      expect(launchButton).toHaveAttribute('aria-label', 'Launch OpenClaw');
      expect(closeButton).toHaveAttribute('aria-label', 'Close installer');
    });

    it('should have ARIA label on success icon', () => {
      const summary: InstallationSummary = {};
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      const icon = screen.getByLabelText('Success');
      expect(icon).toHaveAttribute('aria-label', 'Success');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single configured API', () => {
      const summary: InstallationSummary = {
        configuredApis: ['Anthropic'],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(screen.getByText('Configured APIs:')).toBeInTheDocument();
      expect(screen.getByText('Anthropic')).toBeInTheDocument();
    });

    it('should handle very long version strings', () => {
      const summary: InstallationSummary = {
        nodeVersion: 'v22.12.0-long-version-string-with-build-metadata+abc123',
        openclawVersion: '1.0.0-beta.1+build.12345',
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(
        screen.getByText('v22.12.0-long-version-string-with-build-metadata+abc123')
      ).toBeInTheDocument();
      expect(screen.getByText('1.0.0-beta.1+build.12345')).toBeInTheDocument();
    });

    it('should handle many configured APIs', () => {
      const summary: InstallationSummary = {
        configuredApis: [
          'Anthropic',
          'OpenAI',
          'Google Gemini',
          'Cohere',
          'Hugging Face',
        ],
      };
      const onLaunch = vi.fn();
      const onClose = vi.fn();

      render(<SuccessScreen summary={summary} onLaunch={onLaunch} onClose={onClose} />);

      expect(
        screen.getByText('Anthropic, OpenAI, Google Gemini, Cohere, Hugging Face')
      ).toBeInTheDocument();
    });
  });
});
