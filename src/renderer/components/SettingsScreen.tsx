import React, { useState } from 'react';
import './SettingsScreen.css';

interface APIKeys {
  anthropic: string;
  openai: string;
  gemini: string;
}

interface SettingsScreenProps {
  onSave: (keys: APIKeys) => void;
  onBack: () => void;
  initialKeys?: Partial<APIKeys>;
}

interface FieldVisibility {
  anthropic: boolean;
  openai: boolean;
  gemini: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onSave,
  onBack,
  initialKeys = {},
}) => {
  const [apiKeys, setApiKeys] = useState<APIKeys>({
    anthropic: initialKeys.anthropic || '',
    openai: initialKeys.openai || '',
    gemini: initialKeys.gemini || '',
  });

  const [showKeys, setShowKeys] = useState<FieldVisibility>({
    anthropic: false,
    openai: false,
    gemini: false,
  });

  const [validationErrors, setValidationErrors] = useState<
    Partial<Record<keyof APIKeys, string>>
  >({});

  const validateAnthropicKey = (key: string): string | null => {
    if (!key) return null; // Empty is allowed
    if (!key.startsWith('sk-ant-')) {
      return 'Anthropic API key must start with "sk-ant-"';
    }
    if (key.length < 20) {
      return 'Anthropic API key seems too short';
    }
    return null;
  };

  const validateOpenAIKey = (key: string): string | null => {
    if (!key) return null; // Empty is allowed
    if (!key.startsWith('sk-')) {
      return 'OpenAI API key must start with "sk-"';
    }
    if (key.length < 20) {
      return 'OpenAI API key seems too short';
    }
    return null;
  };

  const validateGeminiKey = (key: string): string | null => {
    if (!key) return null; // Empty is allowed
    // Gemini API keys typically start with "AI" followed by alphanumeric
    if (key.length > 0 && key.length < 10) {
      return 'Gemini API key seems too short';
    }
    return null;
  };

  const handleInputChange = (field: keyof APIKeys, value: string) => {
    setApiKeys((prev) => ({ ...prev, [field]: value }));

    // Validate on change
    let error: string | null = null;
    if (field === 'anthropic') {
      error = validateAnthropicKey(value);
    } else if (field === 'openai') {
      error = validateOpenAIKey(value);
    } else if (field === 'gemini') {
      error = validateGeminiKey(value);
    }

    setValidationErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[field] = error;
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const toggleVisibility = (field: keyof FieldVisibility) => {
    setShowKeys((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation
    const errors: Partial<Record<keyof APIKeys, string>> = {};
    const anthropicError = validateAnthropicKey(apiKeys.anthropic);
    const openaiError = validateOpenAIKey(apiKeys.openai);
    const geminiError = validateGeminiKey(apiKeys.gemini);

    if (anthropicError) errors.anthropic = anthropicError;
    if (openaiError) errors.openai = openaiError;
    if (geminiError) errors.gemini = geminiError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSave(apiKeys);
  };

  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="settings-screen">
      <div className="settings-container">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          ← Back
        </button>

        <h1 className="settings-title">API Key Configuration</h1>
        <p className="settings-description">
          Configure your API keys for OpenClaw. These are optional but enable
          AI features.
        </p>

        <form className="settings-form" onSubmit={handleSubmit}>
          {/* Anthropic API Key */}
          <div className="form-group">
            <label htmlFor="anthropic-key">
              Anthropic API Key
              <span className="optional-label">(Optional)</span>
            </label>
            <div className="input-wrapper">
              <input
                id="anthropic-key"
                type={showKeys.anthropic ? 'text' : 'password'}
                value={apiKeys.anthropic}
                onChange={(e) => handleInputChange('anthropic', e.target.value)}
                placeholder="sk-ant-..."
                className={validationErrors.anthropic ? 'input-error' : ''}
                aria-invalid={!!validationErrors.anthropic}
                aria-describedby={
                  validationErrors.anthropic
                    ? 'anthropic-error'
                    : 'anthropic-hint'
                }
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility('anthropic')}
                aria-label={
                  showKeys.anthropic ? 'Hide API key' : 'Show API key'
                }
              >
                {showKeys.anthropic ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.anthropic && (
              <p className="error-message" id="anthropic-error">
                {validationErrors.anthropic}
              </p>
            )}
            <p className="field-hint" id="anthropic-hint">
              Get your key from{' '}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                console.anthropic.com
              </a>
            </p>
          </div>

          {/* OpenAI API Key */}
          <div className="form-group">
            <label htmlFor="openai-key">
              OpenAI API Key
              <span className="optional-label">(Optional)</span>
            </label>
            <div className="input-wrapper">
              <input
                id="openai-key"
                type={showKeys.openai ? 'text' : 'password'}
                value={apiKeys.openai}
                onChange={(e) => handleInputChange('openai', e.target.value)}
                placeholder="sk-..."
                className={validationErrors.openai ? 'input-error' : ''}
                aria-invalid={!!validationErrors.openai}
                aria-describedby={
                  validationErrors.openai ? 'openai-error' : 'openai-hint'
                }
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility('openai')}
                aria-label={showKeys.openai ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.openai ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.openai && (
              <p className="error-message" id="openai-error">
                {validationErrors.openai}
              </p>
            )}
            <p className="field-hint" id="openai-hint">
              Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                platform.openai.com
              </a>
            </p>
          </div>

          {/* Gemini API Key */}
          <div className="form-group">
            <label htmlFor="gemini-key">
              Google Gemini API Key
              <span className="optional-label">(Optional)</span>
            </label>
            <div className="input-wrapper">
              <input
                id="gemini-key"
                type={showKeys.gemini ? 'text' : 'password'}
                value={apiKeys.gemini}
                onChange={(e) => handleInputChange('gemini', e.target.value)}
                placeholder="Enter your Gemini API key"
                className={validationErrors.gemini ? 'input-error' : ''}
                aria-invalid={!!validationErrors.gemini}
                aria-describedby={
                  validationErrors.gemini ? 'gemini-error' : 'gemini-hint'
                }
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => toggleVisibility('gemini')}
                aria-label={showKeys.gemini ? 'Hide API key' : 'Show API key'}
              >
                {showKeys.gemini ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.gemini && (
              <p className="error-message" id="gemini-error">
                {validationErrors.gemini}
              </p>
            )}
            <p className="field-hint" id="gemini-hint">
              Get your key from{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                aistudio.google.com
              </a>
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-button"
              disabled={hasErrors}
              aria-disabled={hasErrors}
            >
              Save Configuration
            </button>
            <button type="button" className="skip-button" onClick={onBack}>
              Skip for Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
