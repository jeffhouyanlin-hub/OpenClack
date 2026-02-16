import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  describe('rendering', () => {
    it('should render children', () => {
      render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('should not show tooltip by default', () => {
      render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('should render tooltip wrapper', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip-wrapper')).toBeInTheDocument();
    });
  });

  describe('hover behavior', () => {
    it('should show tooltip on mouse enter', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      expect(screen.getByText('Help text')).toBeInTheDocument();
    });

    it('should hide tooltip on mouse leave', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.mouseLeave(wrapper);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('focus behavior', () => {
    it('should show tooltip on focus', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Focus me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.focus(wrapper);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('should hide tooltip on blur', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Focus me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.focus(wrapper);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      fireEvent.blur(wrapper);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('should default to top position', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const tooltip = container.querySelector('.tooltip--top');
      expect(tooltip).toBeInTheDocument();
    });

    it('should support bottom position', () => {
      const { container } = render(
        <Tooltip text="Help text" position="bottom">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const tooltip = container.querySelector('.tooltip--bottom');
      expect(tooltip).toBeInTheDocument();
    });

    it('should support left position', () => {
      const { container } = render(
        <Tooltip text="Help text" position="left">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const tooltip = container.querySelector('.tooltip--left');
      expect(tooltip).toBeInTheDocument();
    });

    it('should support right position', () => {
      const { container } = render(
        <Tooltip text="Help text" position="right">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const tooltip = container.querySelector('.tooltip--right');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('links', () => {
    const apiLinks = [
      { label: 'Anthropic Docs', url: 'https://docs.anthropic.com' },
      { label: 'OpenAI Docs', url: 'https://platform.openai.com/docs' },
    ];

    it('should render links when provided', () => {
      const { container } = render(
        <Tooltip text="Configure API keys" links={apiLinks}>
          <button>Settings</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      expect(screen.getByText('Anthropic Docs')).toBeInTheDocument();
      expect(screen.getByText('OpenAI Docs')).toBeInTheDocument();
    });

    it('should render links with correct href', () => {
      const { container } = render(
        <Tooltip text="Configure API keys" links={apiLinks}>
          <button>Settings</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const links = container.querySelectorAll('.tooltip-link');
      expect(links[0]).toHaveAttribute('href', 'https://docs.anthropic.com');
      expect(links[1]).toHaveAttribute('href', 'https://platform.openai.com/docs');
    });

    it('should open links in new tab', () => {
      const { container } = render(
        <Tooltip text="Configure API keys" links={apiLinks}>
          <button>Settings</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const links = container.querySelectorAll('.tooltip-link');
      links.forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should not render links section when no links provided', () => {
      const { container } = render(
        <Tooltip text="Simple tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      expect(container.querySelector('.tooltip-links')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have role="tooltip"', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('should set aria-describedby when visible', () => {
      const { container } = render(
        <Tooltip text="Help text">
          <button>Hover me</button>
        </Tooltip>
      );

      const wrapper = container.querySelector('.tooltip-wrapper')!;
      fireEvent.mouseEnter(wrapper);

      const tooltip = screen.getByRole('tooltip');
      const tooltipId = tooltip.getAttribute('id');
      const described = wrapper.querySelector(`[aria-describedby="${tooltipId}"]`);
      expect(described).toBeInTheDocument();
    });
  });
});
