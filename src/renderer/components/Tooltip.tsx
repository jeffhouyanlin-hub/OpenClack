/**
 * Tooltip - feat-062: Tooltips and help text
 * Shows help text on hover with optional links to API provider docs
 */
import React, { useState, useRef } from 'react';

export interface TooltipLink {
  label: string;
  url: string;
}

export interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  links?: TooltipLink[];
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  children,
  position = 'top',
  links,
}) => {
  const [visible, setVisible] = useState(false);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 9)}`);

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <div
        aria-describedby={visible ? tooltipId.current : undefined}
      >
        {children}
      </div>
      {visible && (
        <div
          id={tooltipId.current}
          className={`tooltip tooltip--${position}`}
          role="tooltip"
        >
          <span className="tooltip-text">{text}</span>
          {links && links.length > 0 && (
            <div className="tooltip-links">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tooltip-link"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
