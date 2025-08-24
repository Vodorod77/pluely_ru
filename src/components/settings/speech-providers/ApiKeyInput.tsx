import { useState, useEffect } from "react";
import { KeyIcon, TrashIcon } from "lucide-react";
import { Button, Input, Label } from "@/components";
import { SpeechProvider } from "@/types";

interface SpeechProviderApiKeyInputProps {
  provider: SpeechProvider;
  onSubmit: (providerId: string, apiKey: string) => void;
  onDelete: (providerId: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isSubmitted: boolean;
  disabled?: boolean;
  shouldSkipApiKey?: boolean;
}

export const SpeechProviderApiKeyInput = ({
  provider,
  onSubmit,
  onDelete,
  onKeyPress,
  isSubmitted,
  disabled,
  shouldSkipApiKey = false,
}: SpeechProviderApiKeyInputProps) => {
  const [apiKeyValue, setApiKeyValue] = useState("");

  // Initialize with provider's API key
  useEffect(() => {
    setApiKeyValue(provider.apiKey || "");
  }, [provider.apiKey, provider.id]);

  const getAuthPlaceholder = () => {
    switch (provider.authType) {
      case "bearer":
        return "Bearer token or API key";
      case "custom-header":
        return provider.customHeaderName || "API key";
      case "query":
        return "API key";
      default:
        return "API key";
    }
  };

  const getAuthLabel = () => {
    switch (provider.authType) {
      case "bearer":
        return "API Key";
      case "custom-header":
        return provider.customHeaderName || "API Key";
      case "query":
        return "API Key";
      default:
        return "API Key";
    }
  };

  const handleSubmit = () => {
    if (apiKeyValue.trim()) {
      onSubmit(provider.id, apiKeyValue.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
    onKeyPress(e);
  };

  if (shouldSkipApiKey) {
    return (
      <div className="space-y-3">
        <div className="border-b border-input/50 pb-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            {provider.name} Configuration
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium">{provider.name}</span> is
            automatically configured using your OpenAI API key. No additional
            configuration needed.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-800">
            ✅ Using OpenAI API key - Ready to use!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-b border-input/50 pb-2">
        <Label className="text-sm font-semibold flex items-center gap-2">
          {provider.name} API Key
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Enter your <span className="font-medium">{provider.name}</span> API
          key to enable speech-to-text functionality. Your key is stored locally
          and never shared.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">{getAuthLabel()}</Label>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder={getAuthPlaceholder()}
            value={apiKeyValue}
            onChange={(e) => setApiKeyValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSubmitted || disabled}
            className="flex-1 h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
          />
          {!isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!apiKeyValue.trim()}
              size="icon"
              className="shrink-0 h-11 w-11"
              title="Submit API Key"
            >
              <KeyIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => onDelete(provider.id)}
              size="icon"
              variant="destructive"
              className="shrink-0 h-11 w-11"
              title="Remove API Key"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
