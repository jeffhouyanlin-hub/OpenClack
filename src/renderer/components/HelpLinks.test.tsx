/**
 * feat-081-082: Documentation / in-app help links tests
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpLinks, DEFAULT_HELP_LINKS } from './HelpLinks';

describe('HelpLinks', () => {
  describe('rendering', () => {
    it('should render default help links', () => {
      render(<HelpLinks />);
      expect(screen.getByText('Help & Resources')).toBeInTheDocument();
    });

    it('should render all default links', () => {
      render(<HelpLinks />);
      for (const link of DEFAULT_HELP_LINKS) {
        expect(screen.getByText(link.label)).toBeInTheDocument();
      }
    });

    it('should render custom links', () => {
      const customLinks = [
        { label: 'Custom Docs', url: 'https://example.com' },
      ];
      render(<HelpLinks links={customLinks} />);
      expect(screen.getByText('Custom Docs')).toBeInTheDocument();
    });

    it('should render custom title', () => {
      render(<HelpLinks title="Need Help?" />);
      expect(screen.getByText('Need Help?')).toBeInTheDocument();
    });
  });

  describe('links', () => {
    it('should have correct href attributes', () => {
      const { container } = render(<HelpLinks />);
      const links = container.querySelectorAll('.help-link');

      DEFAULT_HELP_LINKS.forEach((helpLink, index) => {
        expect(links[index]).toHaveAttribute('href', helpLink.url);
      });
    });

    it('should open links in new tabs', () => {
      const { container } = render(<HelpLinks />);
      const links = container.querySelectorAll('.help-link');

      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should render descriptions when provided', () => {
      render(<HelpLinks />);
      expect(screen.getByText('Official OpenClaw documentation and guides')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have navigation role', () => {
      render(<HelpLinks />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have aria-label on navigation', () => {
      render(<HelpLinks title="Resources" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Resources');
    });

    it('should have aria-label on links with descriptions', () => {
      const links = [
        { label: 'Docs', url: 'https://example.com', description: 'Full documentation' },
      ];
      render(<HelpLinks links={links} />);

      const link = screen.getByRole('link', { name: 'Full documentation' });
      expect(link).toBeInTheDocument();
    });
  });

  describe('DEFAULT_HELP_LINKS', () => {
    it('should contain Anthropic docs link', () => {
      const anthropic = DEFAULT_HELP_LINKS.find(l => l.label.includes('Anthropic'));
      expect(anthropic).toBeDefined();
      expect(anthropic?.url).toContain('anthropic.com');
    });

    it('should contain OpenAI docs link', () => {
      const openai = DEFAULT_HELP_LINKS.find(l => l.label.includes('OpenAI'));
      expect(openai).toBeDefined();
      expect(openai?.url).toContain('openai.com');
    });

    it('should contain issue reporting link', () => {
      const issue = DEFAULT_HELP_LINKS.find(l => l.label.includes('Issue'));
      expect(issue).toBeDefined();
      expect(issue?.url).toContain('github.com');
    });
  });
});
