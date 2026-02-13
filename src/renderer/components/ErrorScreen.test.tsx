import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorScreen, ErrorDetails } from './ErrorScreen';
import { LogEntry } from './InstallationScreen';

describe('ErrorScreen', () => {
  const mockError: ErrorDetails = {
    message: 'Failed to install Node.js',
    stack: 'Error: Failed to install Node.js\n    at installNode (/app/installer.ts:42:15)',
    code: 'ERR_NODE_INSTALL',
  };

  const mockLogs: LogEntry[] = [
    { level: 'info', message: 'Starting installation...', timestamp: Date.now() - 5000 },
    { level: 'info', message: 'Checking Node.js version...', timestamp: Date.now() - 4000 },
    { level: 'warning', message: 'Node.js not found', timestamp: Date.now() - 3000 },
    { level: 'info', message: 'Downloading Node.js installer...', timestamp: Date.now() - 2000 },
    { level: 'error', message: 'Download failed: Network error', timestamp: Date.now() - 1000 },
  ];

  const mockOnRetry = vi.fn();

  describe('Rendering', () => {
    it('should render error icon', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const icon = screen.getByLabelText('Error');
      expect(icon).toBeDefined();
      expect(icon.textContent).toBe('✕');
    });

    it('should render error title', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText('Installation Failed')).toBeDefined();
    });

    it('should render error message', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(mockError.message)).toBeDefined();
    });

    it('should render error code when provided', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(/ERR_NODE_INSTALL/)).toBeDefined();
    });

    it('should not render error code section when code is not provided', () => {
      const errorWithoutCode: ErrorDetails = {
        message: 'Installation failed',
      };
      render(<ErrorScreen error={errorWithoutCode} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.queryByText(/Error Code:/)).toBeNull();
    });

    it('should render retry button', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const retryButton = screen.getByLabelText('Retry installation');
      expect(retryButton).toBeDefined();
      expect(retryButton.textContent).toBe('Retry Installation');
    });
  });

  describe('Stack Trace', () => {
    it('should render stack trace toggle button when stack is provided', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(/Stack Trace/)).toBeDefined();
    });

    it('should not render stack trace section when stack is not provided', () => {
      const errorWithoutStack: ErrorDetails = {
        message: 'Installation failed',
      };
      render(<ErrorScreen error={errorWithoutStack} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.queryByText(/Stack Trace/)).toBeNull();
    });

    it('should initially hide stack trace', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const stackTrace = screen.queryByText(/at installNode/);
      expect(stackTrace).toBeNull();
    });

    it('should show stack trace when toggle button is clicked', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);
      fireEvent.click(toggleButton);

      const stackTrace = screen.getByText(/at installNode/);
      expect(stackTrace).toBeDefined();
    });

    it('should hide stack trace when toggle button is clicked again', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);

      // Show stack trace
      fireEvent.click(toggleButton);
      expect(screen.getByText(/at installNode/)).toBeDefined();

      // Hide stack trace
      fireEvent.click(toggleButton);
      expect(screen.queryByText(/at installNode/)).toBeNull();
    });

    it('should set aria-expanded attribute correctly on stack trace toggle', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);

      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('should display full stack trace content', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);
      fireEvent.click(toggleButton);

      const stackTraceElement = screen.getByLabelText('Error stack trace');
      expect(stackTraceElement.textContent).toBe(mockError.stack);
    });
  });

  describe('Logs', () => {
    it('should render logs toggle button', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(/View Full Logs/)).toBeDefined();
    });

    it('should show log count in toggle button', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(/5 entries/)).toBeDefined();
    });

    it('should initially hide logs', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const logMessage = screen.queryByText('Starting installation...');
      expect(logMessage).toBeNull();
    });

    it('should show logs when toggle button is clicked', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      expect(screen.getByText('Starting installation...')).toBeDefined();
      expect(screen.getByText('Checking Node.js version...')).toBeDefined();
      expect(screen.getByText('Node.js not found')).toBeDefined();
    });

    it('should hide logs when toggle button is clicked again', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);

      // Show logs
      fireEvent.click(toggleButton);
      expect(screen.getByText('Starting installation...')).toBeDefined();

      // Hide logs
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Starting installation...')).toBeNull();
    });

    it('should set aria-expanded attribute correctly on logs toggle', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);

      expect(toggleButton.getAttribute('aria-expanded')).toBe('false');

      fireEvent.click(toggleButton);
      expect(toggleButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('should display all log entries when expanded', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      mockLogs.forEach(log => {
        expect(screen.getByText(log.message)).toBeDefined();
      });
    });

    it('should apply correct CSS class for info logs', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      const infoLog = screen.getByText('Starting installation...').closest('.log-entry');
      expect(infoLog?.classList.contains('log-entry--info')).toBe(true);
    });

    it('should apply correct CSS class for warning logs', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      const warningLog = screen.getByText('Node.js not found').closest('.log-entry');
      expect(warningLog?.classList.contains('log-entry--warning')).toBe(true);
    });

    it('should apply correct CSS class for error logs', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      const errorLog = screen.getByText(/Download failed/).closest('.log-entry');
      expect(errorLog?.classList.contains('log-entry--error')).toBe(true);
    });

    it('should display "No logs available" when logs array is empty', () => {
      render(<ErrorScreen error={mockError} logs={[]} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      expect(screen.getByText('No logs available')).toBeDefined();
    });

    it('should format timestamps correctly', () => {
      const testLog: LogEntry[] = [
        { level: 'info', message: 'Test message', timestamp: new Date('2024-01-15T10:30:00').getTime() },
      ];
      render(<ErrorScreen error={mockError} logs={testLog} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      // Check that a timestamp is displayed (format may vary by locale)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}(:\d{2})?/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Retry Button', () => {
    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry installation');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not call onRetry multiple times for single click', () => {
      const onRetry = vi.fn();
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={onRetry} />);

      const retryButton = screen.getByLabelText('Retry installation');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible error icon', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByLabelText('Error')).toBeDefined();
    });

    it('should have accessible retry button', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByLabelText('Retry installation')).toBeDefined();
    });

    it('should have accessible logs container', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText('Full installation log output')).toBeDefined();
    });

    it('should have accessible stack trace container', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);
      fireEvent.click(toggleButton);

      expect(screen.getByLabelText('Error stack trace')).toBeDefined();
    });

    it('should use proper ARIA attributes for expandable sections', () => {
      render(<ErrorScreen error={mockError} logs={mockLogs} onRetry={mockOnRetry} />);

      const stackTraceToggle = screen.getByText(/Stack Trace/);
      expect(stackTraceToggle.hasAttribute('aria-expanded')).toBe(true);
      expect(stackTraceToggle.hasAttribute('aria-controls')).toBe(true);

      const logsToggle = screen.getByText(/View Full Logs/);
      expect(logsToggle.hasAttribute('aria-expanded')).toBe(true);
      expect(logsToggle.hasAttribute('aria-controls')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longError: ErrorDetails = {
        message: 'A'.repeat(500),
      };
      render(<ErrorScreen error={longError} logs={mockLogs} onRetry={mockOnRetry} />);
      expect(screen.getByText(longError.message)).toBeDefined();
    });

    it('should handle very long stack traces', () => {
      const longStackError: ErrorDetails = {
        message: 'Error',
        stack: 'Line\n'.repeat(100),
      };
      render(<ErrorScreen error={longStackError} logs={mockLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/Stack Trace/);
      fireEvent.click(toggleButton);

      const stackTrace = screen.getByLabelText('Error stack trace');
      expect(stackTrace.textContent?.includes('Line')).toBe(true);
    });

    it('should handle large number of logs', () => {
      const largeLogs: LogEntry[] = Array.from({ length: 100 }, (_, i) => ({
        level: 'info' as const,
        message: `Log entry ${i}`,
        timestamp: Date.now() - (100 - i) * 1000,
      }));

      render(<ErrorScreen error={mockError} logs={largeLogs} onRetry={mockOnRetry} />);
      const toggleButton = screen.getByText(/View Full Logs/);
      expect(screen.getByText(/100 entries/)).toBeDefined();

      fireEvent.click(toggleButton);
      expect(screen.getByText('Log entry 0')).toBeDefined();
      expect(screen.getByText('Log entry 99')).toBeDefined();
    });

    it('should handle error with only message (no code or stack)', () => {
      const minimalError: ErrorDetails = {
        message: 'Simple error',
      };
      render(<ErrorScreen error={minimalError} logs={[]} onRetry={mockOnRetry} />);

      expect(screen.getByText('Simple error')).toBeDefined();
      expect(screen.queryByText(/Error Code:/)).toBeNull();
      expect(screen.queryByText(/Stack Trace/)).toBeNull();
    });
  });
});
