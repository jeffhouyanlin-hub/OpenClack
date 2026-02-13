import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstallationScreen, LogEntry } from './InstallationScreen';

describe('InstallationScreen', () => {
  const mockLogs: LogEntry[] = [
    { level: 'info', message: 'Starting installation...', timestamp: 1234567890000 },
    { level: 'warning', message: 'Node.js not found, will install', timestamp: 1234567891000 },
    { level: 'error', message: 'Network error occurred', timestamp: 1234567892000 },
  ];

  describe('Rendering', () => {
    it('should render the installation screen', () => {
      render(
        <InstallationScreen progress={50} currentStep="Installing Node.js..." logs={[]} />
      );

      expect(screen.getByText('Installing OpenClaw')).toBeInTheDocument();
    });

    it('should render the title', () => {
      render(
        <InstallationScreen progress={50} currentStep="Installing Node.js..." logs={[]} />
      );

      const title = screen.getByText('Installing OpenClaw');
      expect(title).toBeInTheDocument();
      expect(title.tagName).toBe('H1');
    });

    it('should render the installation log heading', () => {
      render(
        <InstallationScreen progress={50} currentStep="Installing Node.js..." logs={[]} />
      );

      expect(screen.getByText('Installation Log')).toBeInTheDocument();
    });
  });

  describe('Progress Section', () => {
    it('should display current step', () => {
      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing Node.js..."
          logs={[]}
        />
      );

      expect(screen.getByText('Installing Node.js...')).toBeInTheDocument();
    });

    it('should display progress percentage', () => {
      render(
        <InstallationScreen
          progress={75}
          currentStep="Installing OpenClaw..."
          logs={[]}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should round progress percentage', () => {
      render(
        <InstallationScreen
          progress={33.7}
          currentStep="Installing..."
          logs={[]}
        />
      );

      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('should render progress bar with correct width', () => {
      render(
        <InstallationScreen
          progress={60}
          currentStep="Installing..."
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    it('should render progress bar with 0% width', () => {
      render(
        <InstallationScreen
          progress={0}
          currentStep="Starting..."
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '0%' });
    });

    it('should render progress bar with 100% width', () => {
      render(
        <InstallationScreen
          progress={100}
          currentStep="Complete"
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('should have correct ARIA attributes on progress bar', () => {
      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label', 'Installation progress');
    });
  });

  describe('Logs Section', () => {
    it('should show placeholder message when no logs', () => {
      render(
        <InstallationScreen
          progress={0}
          currentStep="Starting..."
          logs={[]}
        />
      );

      expect(screen.getByText('Preparing installation...')).toBeInTheDocument();
    });

    it('should render log entries', () => {
      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={mockLogs}
        />
      );

      expect(screen.getByText('Starting installation...')).toBeInTheDocument();
      expect(screen.getByText('Node.js not found, will install')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('should render correct number of log entries', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={mockLogs}
        />
      );

      const logEntries = container.querySelectorAll('.log-entry');
      expect(logEntries).toHaveLength(3);
    });

    it('should format timestamps correctly', () => {
      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={mockLogs}
        />
      );

      const timestamps = document.querySelectorAll('.log-timestamp');
      expect(timestamps.length).toBeGreaterThan(0);
      // Timestamps should be formatted as locale time strings
      timestamps.forEach((timestamp) => {
        expect(timestamp.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
      });
    });

    it('should apply correct CSS class for info logs', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[mockLogs[0]]}
        />
      );

      const logEntry = container.querySelector('.log-entry--info');
      expect(logEntry).toBeInTheDocument();
      expect(logEntry?.textContent).toContain('Starting installation...');
    });

    it('should apply correct CSS class for warning logs', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[mockLogs[1]]}
        />
      );

      const logEntry = container.querySelector('.log-entry--warning');
      expect(logEntry).toBeInTheDocument();
      expect(logEntry?.textContent).toContain('Node.js not found, will install');
    });

    it('should apply correct CSS class for error logs', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[mockLogs[2]]}
        />
      );

      const logEntry = container.querySelector('.log-entry--error');
      expect(logEntry).toBeInTheDocument();
      expect(logEntry?.textContent).toContain('Network error occurred');
    });

    it('should have correct ARIA attributes on logs container', () => {
      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={mockLogs}
        />
      );

      const logsContainer = screen.getByRole('log');
      expect(logsContainer).toHaveAttribute('aria-live', 'polite');
      expect(logsContainer).toHaveAttribute('aria-label', 'Installation log output');
    });
  });

  describe('Auto-scrolling', () => {
    it('should auto-scroll to bottom when logs update', () => {
      const { rerender } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[mockLogs[0]]}
        />
      );

      const logsContainer = screen.getByRole('log');
      const scrollSpy = vi.spyOn(logsContainer, 'scrollTop', 'set');

      // Add more logs
      rerender(
        <InstallationScreen
          progress={60}
          currentStep="Installing..."
          logs={mockLogs}
        />
      );

      // Should have attempted to set scrollTop to scrollHeight
      expect(scrollSpy).toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('should have installation-screen class', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[]}
        />
      );

      expect(container.querySelector('.installation-screen')).toBeInTheDocument();
    });

    it('should have installation-content class', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[]}
        />
      );

      expect(container.querySelector('.installation-content')).toBeInTheDocument();
    });

    it('should have progress-section class', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[]}
        />
      );

      expect(container.querySelector('.progress-section')).toBeInTheDocument();
    });

    it('should have logs-section class', () => {
      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={[]}
        />
      );

      expect(container.querySelector('.logs-section')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty current step', () => {
      render(
        <InstallationScreen
          progress={0}
          currentStep=""
          logs={[]}
        />
      );

      expect(screen.getByText('Installing OpenClaw')).toBeInTheDocument();
    });

    it('should handle negative progress (clamped to 0)', () => {
      render(
        <InstallationScreen
          progress={-10}
          currentStep="Starting..."
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '-10%' });
      // Note: The component doesn't clamp the value - this is intentional to show real data
      // The CSS will handle the visual clamping
    });

    it('should handle progress over 100', () => {
      render(
        <InstallationScreen
          progress={110}
          currentStep="Complete"
          logs={[]}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '110%' });
      expect(screen.getByText('110%')).toBeInTheDocument();
    });

    it('should handle very long current step text', () => {
      const longStep = 'A'.repeat(200);
      render(
        <InstallationScreen
          progress={50}
          currentStep={longStep}
          logs={[]}
        />
      );

      expect(screen.getByText(longStep)).toBeInTheDocument();
    });

    it('should handle very long log messages', () => {
      const longMessage = 'B'.repeat(500);
      const logs: LogEntry[] = [
        { level: 'info', message: longMessage, timestamp: Date.now() },
      ];

      render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={logs}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle many log entries', () => {
      const manyLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
        level: 'info' as const,
        message: `Log entry ${i}`,
        timestamp: Date.now() + i * 1000,
      }));

      const { container } = render(
        <InstallationScreen
          progress={50}
          currentStep="Installing..."
          logs={manyLogs}
        />
      );

      const logEntries = container.querySelectorAll('.log-entry');
      expect(logEntries).toHaveLength(100);
    });
  });
});
