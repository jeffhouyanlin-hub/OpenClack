/**
 * feat-065: Installation cancellation tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InstallationScreen } from './InstallationScreen';

describe('InstallationScreen - Cancel Button (feat-065)', () => {
  beforeEach(() => {
    // Mock window.electronAPI
    (window as any).electronAPI = {
      cancelInstall: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    delete (window as any).electronAPI;
  });

  it('should render the cancel button', () => {
    render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );
    expect(screen.getByText('Cancel Installation')).toBeInTheDocument();
  });

  it('should have correct aria-label on cancel button', () => {
    render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );
    const cancelBtn = screen.getByRole('button', { name: /cancel installation/i });
    expect(cancelBtn).toBeInTheDocument();
  });

  it('should call onCancel prop when provided', () => {
    const onCancel = vi.fn();
    render(
      <InstallationScreen
        progress={50}
        currentStep="Installing..."
        logs={[]}
        onCancel={onCancel}
      />
    );

    const cancelBtn = screen.getByText('Cancel Installation');
    fireEvent.click(cancelBtn);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should call window.electronAPI.cancelInstall when no onCancel prop', () => {
    render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );

    const cancelBtn = screen.getByText('Cancel Installation');
    fireEvent.click(cancelBtn);

    expect(window.electronAPI.cancelInstall).toHaveBeenCalledTimes(1);
  });

  it('should have cancel-button CSS class', () => {
    const { container } = render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );

    const cancelBtn = container.querySelector('.cancel-button');
    expect(cancelBtn).toBeInTheDocument();
  });

  it('should have installation-actions container', () => {
    const { container } = render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );

    expect(container.querySelector('.installation-actions')).toBeInTheDocument();
  });

  it('should have role="main" on installation screen', () => {
    render(
      <InstallationScreen progress={50} currentStep="Installing..." logs={[]} />
    );

    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
