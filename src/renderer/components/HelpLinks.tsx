/**
 * HelpLinks - feat-081-082: Documentation / in-app help links
 * Provides links to documentation and support resources
 */
import React from 'react';

export interface HelpLink {
  label: string;
  url: string;
  description?: string;
}

export const DEFAULT_HELP_LINKS: HelpLink[] = [
  {
    label: 'OpenClaw Documentation',
    url: 'https://docs.openclaw.ai',
    description: 'Official OpenClaw documentation and guides',
  },
  {
    label: 'Anthropic API Keys',
    url: 'https://console.anthropic.com/settings/keys',
    description: 'Get your Anthropic API key',
  },
  {
    label: 'OpenAI API Keys',
    url: 'https://platform.openai.com/api-keys',
    description: 'Get your OpenAI API key',
  },
  {
    label: 'Google AI Studio',
    url: 'https://aistudio.google.com/app/apikey',
    description: 'Get your Gemini API key',
  },
  {
    label: 'Report an Issue',
    url: 'https://github.com/openclaw/openclack/issues',
    description: 'Report bugs or request features',
  },
];

export interface HelpLinksProps {
  links?: HelpLink[];
  title?: string;
}

export const HelpLinks: React.FC<HelpLinksProps> = ({
  links = DEFAULT_HELP_LINKS,
  title = 'Help & Resources',
}) => {
  return (
    <nav className="help-links" aria-label={title}>
      <h3 className="help-links-title">{title}</h3>
      <ul className="help-links-list">
        {links.map((link, index) => (
          <li key={index} className="help-links-item">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="help-link"
              aria-label={link.description || link.label}
            >
              {link.label}
            </a>
            {link.description && (
              <span className="help-link-description">{link.description}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
