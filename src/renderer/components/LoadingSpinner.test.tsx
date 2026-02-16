import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from './LoadingSpinner';

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('should render the spinner container', () => {
      const { container } = render(<LoadingSpinner />);
      const spinner = container.querySelector('.loading-spinner-container');
      expect(spinner).toBeInTheDocument();
    });

    it('should render with default message "Loading..."', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render with custom message', () => {
      render(<LoadingSpinner message="Checking system requirements..." />);
      expect(screen.getByText('Checking system requirements...')).toBeInTheDocument();
    });

    it('should render the SVG spinner', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render track and indicator circles', () => {
      const { container } = render(<LoadingSpinner />);
      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });
  });

  describe('sizes', () => {
    it('should render small size', () => {
      const { container } = render(<LoadingSpinner size="small" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24');
      expect(svg).toHaveAttribute('height', '24');
    });

    it('should render medium size (default)', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '48');
      expect(svg).toHaveAttribute('height', '48');
    });

    it('should render large size', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '72');
      expect(svg).toHaveAttribute('height', '72');
    });

    it('should apply size CSS class', () => {
      const { container } = render(<LoadingSpinner size="large" />);
      const svg = container.querySelector('.loading-spinner--large');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<LoadingSpinner />);
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('should have aria-label matching message', () => {
      render(<LoadingSpinner message="Checking..." />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label', 'Checking...');
    });

    it('should have aria-live="polite"', () => {
      render(<LoadingSpinner />);
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide SVG from screen readers', () => {
      const { container } = render(<LoadingSpinner />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('animation', () => {
    it('should contain animateTransform for rotation', () => {
      const { container } = render(<LoadingSpinner />);
      const animateTransform = container.querySelector('animateTransform');
      expect(animateTransform).toBeInTheDocument();
      expect(animateTransform).toHaveAttribute('type', 'rotate');
      expect(animateTransform).toHaveAttribute('repeatCount', 'indefinite');
    });
  });
});
