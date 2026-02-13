import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsScreen } from './SettingsScreen';

describe('SettingsScreen', () => {
  const mockOnSave = vi.fn();
  const mockOnBack = vi.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onBack: mockOnBack,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the settings screen with title and description', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByText('API Key Configuration')).toBeInTheDocument();
      expect(
        screen.getByText(/Configure your API keys for OpenClaw/i)
      ).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(<SettingsScreen {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('renders all three API key input fields', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByLabelText(/Anthropic API Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/OpenAI API Key/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Google Gemini API Key/i)
      ).toBeInTheDocument();
    });

    it('renders save and skip buttons', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /save configuration/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /skip for now/i })
      ).toBeInTheDocument();
    });

    it('renders show/hide toggle buttons for each field', () => {
      render(<SettingsScreen {...defaultProps} />);

      const toggleButtons = screen.getAllByRole('button', {
        name: /show api key|hide api key/i,
      });
      expect(toggleButtons).toHaveLength(3);
    });

    it('renders help links for each provider', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(
        screen.getByRole('link', { name: /console.anthropic.com/i })
      ).toHaveAttribute('href', 'https://console.anthropic.com/settings/keys');
      expect(
        screen.getByRole('link', { name: /platform.openai.com/i })
      ).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
      expect(
        screen.getByRole('link', { name: /aistudio.google.com/i })
      ).toHaveAttribute('href', 'https://aistudio.google.com/app/apikey');
    });
  });

  describe('Initial Values', () => {
    it('initializes with empty values when no initial keys provided', () => {
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(
        /Anthropic API Key/i
      ) as HTMLInputElement;
      const openaiInput = screen.getByLabelText(
        /OpenAI API Key/i
      ) as HTMLInputElement;
      const geminiInput = screen.getByLabelText(
        /Google Gemini API Key/i
      ) as HTMLInputElement;

      expect(anthropicInput.value).toBe('');
      expect(openaiInput.value).toBe('');
      expect(geminiInput.value).toBe('');
    });

    it('initializes with provided initial keys', () => {
      const initialKeys = {
        anthropic: 'sk-ant-test123',
        openai: 'sk-test456',
        gemini: 'gemini-test789',
      };

      render(<SettingsScreen {...defaultProps} initialKeys={initialKeys} />);

      const anthropicInput = screen.getByLabelText(
        /Anthropic API Key/i
      ) as HTMLInputElement;
      const openaiInput = screen.getByLabelText(
        /OpenAI API Key/i
      ) as HTMLInputElement;
      const geminiInput = screen.getByLabelText(
        /Google Gemini API Key/i
      ) as HTMLInputElement;

      expect(anthropicInput.value).toBe('sk-ant-test123');
      expect(openaiInput.value).toBe('sk-test456');
      expect(geminiInput.value).toBe('gemini-test789');
    });

    it('inputs are password type by default', () => {
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      const openaiInput = screen.getByLabelText(/OpenAI API Key/i);
      const geminiInput = screen.getByLabelText(/Google Gemini API Key/i);

      expect(anthropicInput).toHaveAttribute('type', 'password');
      expect(openaiInput).toHaveAttribute('type', 'password');
      expect(geminiInput).toHaveAttribute('type', 'password');
    });
  });

  describe('User Interactions', () => {
    it('allows typing in API key fields', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'sk-ant-test123456789');

      expect(anthropicInput).toHaveValue('sk-ant-test123456789');
    });

    it('toggles visibility of API keys when show/hide button clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      const toggleButtons = screen.getAllByRole('button', {
        name: /show api key/i,
      });

      // Initially password
      expect(anthropicInput).toHaveAttribute('type', 'password');

      // Click to show
      await user.click(toggleButtons[0]);
      expect(anthropicInput).toHaveAttribute('type', 'text');

      // Click to hide again
      const hideButton = screen.getAllByRole('button', {
        name: /hide api key/i,
      })[0];
      await user.click(hideButton);
      expect(anthropicInput).toHaveAttribute('type', 'password');
    });

    it('calls onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: /go back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('calls onBack when skip button is clicked', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const skipButton = screen.getByRole('button', { name: /skip for now/i });
      await user.click(skipButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation - Anthropic API Key', () => {
    it('shows error for invalid Anthropic API key format (wrong prefix)', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'invalid-key');

      expect(
        screen.getByText(/Anthropic API key must start with "sk-ant-"/i)
      ).toBeInTheDocument();
    });

    it('shows error for Anthropic API key that is too short', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'sk-ant-123');

      expect(
        screen.getByText(/Anthropic API key seems too short/i)
      ).toBeInTheDocument();
    });

    it('accepts valid Anthropic API key', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'sk-ant-api03-valid-key-12345678');

      expect(
        screen.queryByText(/Anthropic API key must start with/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Anthropic API key seems too short/i)
      ).not.toBeInTheDocument();
    });

    it('allows empty Anthropic API key', () => {
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      expect(anthropicInput).toHaveValue('');
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation - OpenAI API Key', () => {
    it('shows error for invalid OpenAI API key format (wrong prefix)', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const openaiInput = screen.getByLabelText(/OpenAI API Key/i);
      await user.type(openaiInput, 'invalid-key');

      expect(
        screen.getByText(/OpenAI API key must start with "sk-"/i)
      ).toBeInTheDocument();
    });

    it('shows error for OpenAI API key that is too short', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const openaiInput = screen.getByLabelText(/OpenAI API Key/i);
      await user.type(openaiInput, 'sk-123');

      expect(
        screen.getByText(/OpenAI API key seems too short/i)
      ).toBeInTheDocument();
    });

    it('accepts valid OpenAI API key', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const openaiInput = screen.getByLabelText(/OpenAI API Key/i);
      await user.type(openaiInput, 'sk-valid-openai-key-12345678');

      expect(
        screen.queryByText(/OpenAI API key must start with/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/OpenAI API key seems too short/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Validation - Gemini API Key', () => {
    it('shows error for Gemini API key that is too short', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const geminiInput = screen.getByLabelText(/Google Gemini API Key/i);
      await user.type(geminiInput, 'short');

      expect(
        screen.getByText(/Gemini API key seems too short/i)
      ).toBeInTheDocument();
    });

    it('accepts valid Gemini API key', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const geminiInput = screen.getByLabelText(/Google Gemini API Key/i);
      await user.type(geminiInput, 'valid-gemini-key-12345');

      expect(
        screen.queryByText(/Gemini API key seems too short/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with valid API keys when form is submitted', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      const openaiInput = screen.getByLabelText(/OpenAI API Key/i);
      const geminiInput = screen.getByLabelText(/Google Gemini API Key/i);

      await user.type(anthropicInput, 'sk-ant-valid-key-12345678');
      await user.type(openaiInput, 'sk-valid-openai-key-12345678');
      await user.type(geminiInput, 'valid-gemini-key-12345');

      const saveButton = screen.getByRole('button', {
        name: /save configuration/i,
      });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({
        anthropic: 'sk-ant-valid-key-12345678',
        openai: 'sk-valid-openai-key-12345678',
        gemini: 'valid-gemini-key-12345',
      });
    });

    it('calls onSave with empty strings if no keys entered', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const saveButton = screen.getByRole('button', {
        name: /save configuration/i,
      });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith({
        anthropic: '',
        openai: '',
        gemini: '',
      });
    });

    it('does not call onSave when form has validation errors', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'invalid-key');

      const saveButton = screen.getByRole('button', {
        name: /save configuration/i,
      });
      await user.click(saveButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('disables save button when there are validation errors', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const saveButton = screen.getByRole('button', {
        name: /save configuration/i,
      });

      // Initially enabled (no errors)
      expect(saveButton).not.toBeDisabled();

      // Type invalid key
      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'invalid');

      // Should be disabled
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for inputs', () => {
      render(<SettingsScreen {...defaultProps} />);

      expect(screen.getByLabelText(/Anthropic API Key/i)).toHaveAttribute(
        'aria-describedby',
        'anthropic-hint'
      );
      expect(screen.getByLabelText(/OpenAI API Key/i)).toHaveAttribute(
        'aria-describedby',
        'openai-hint'
      );
      expect(screen.getByLabelText(/Google Gemini API Key/i)).toHaveAttribute(
        'aria-describedby',
        'gemini-hint'
      );
    });

    it('sets aria-invalid when input has error', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);

      // Initially not invalid
      expect(anthropicInput).toHaveAttribute('aria-invalid', 'false');

      // Type invalid key
      await user.type(anthropicInput, 'invalid');

      // Should be invalid
      expect(anthropicInput).toHaveAttribute('aria-invalid', 'true');
      expect(anthropicInput).toHaveAttribute(
        'aria-describedby',
        'anthropic-error'
      );
    });

    it('links error messages to inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'invalid');

      expect(anthropicInput).toHaveAttribute(
        'aria-describedby',
        'anthropic-error'
      );
      expect(screen.getByText(/must start with/i)).toHaveAttribute(
        'id',
        'anthropic-error'
      );
    });

    it('has disabled state on save button with proper aria-disabled', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      await user.type(anthropicInput, 'invalid');

      const saveButton = screen.getByRole('button', {
        name: /save configuration/i,
      });
      expect(saveButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('CSS Classes', () => {
    it('applies error class to input with validation error', async () => {
      const user = userEvent.setup();
      render(<SettingsScreen {...defaultProps} />);

      const anthropicInput = screen.getByLabelText(/Anthropic API Key/i);
      expect(anthropicInput).not.toHaveClass('input-error');

      await user.type(anthropicInput, 'invalid');
      expect(anthropicInput).toHaveClass('input-error');
    });

    it('has proper container structure', () => {
      const { container } = render(<SettingsScreen {...defaultProps} />);

      expect(container.querySelector('.settings-screen')).toBeInTheDocument();
      expect(
        container.querySelector('.settings-container')
      ).toBeInTheDocument();
      expect(container.querySelector('.settings-form')).toBeInTheDocument();
    });
  });
});
