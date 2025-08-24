import { useEffect, useState } from "react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components";
import { speechProviders as defaultSpeechProviders } from "@/config";
import {
  loadSpeechProvidersFromStorage,
  loadSelectedSpeechProvider,
  isSelectedSpeechProviderConfigured,
} from "@/lib";
import { SpeechProvider } from "@/types";

interface SpeechProviderSelectionProps {
  value: string;
  onChange: (value: string) => void;
  refreshKey?: number;
}

export const SpeechProviderSelection = ({
  value,
  onChange,
  refreshKey,
}: SpeechProviderSelectionProps) => {
  const [customProviders, setCustomProviders] = useState<SpeechProvider[]>([]);
  const [selectedSpeechProvider, setSelectedSpeechProviderState] = useState(
    loadSelectedSpeechProvider()
  );
  const [isConfigured, setIsConfigured] = useState(
    isSelectedSpeechProviderConfigured()
  );

  useEffect(() => {
    setCustomProviders(loadSpeechProvidersFromStorage());
    // Refresh selected provider status
    setSelectedSpeechProviderState(loadSelectedSpeechProvider());
    setIsConfigured(isSelectedSpeechProviderConfigured());
  }, [refreshKey, value]);

  return (
    <div className="space-y-3">
      <div className="border-b border-input/50 pb-2">
        <Label className="text-sm font-semibold">Speech-to-Text Provider</Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select your preferred speech-to-text service provider for voice input.
        </p>
      </div>

      <div className="space-y-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
            <SelectValue placeholder="Choose your speech provider" />
          </SelectTrigger>
          <SelectContent>
            {/* Show all default providers including OpenAI Whisper */}
            {defaultSpeechProviders
              .filter((provider) => !provider.isCustom)
              .map((provider) => (
                <SelectItem
                  key={provider.id}
                  value={provider.id}
                  className="cursor-pointer hover:bg-accent/50"
                >
                  <span className="font-medium">{provider.name}</span>
                </SelectItem>
              ))}

            {customProviders.filter((provider) => provider.isCustom).length >
              0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2">
                  Custom Providers
                </div>
                {customProviders
                  .filter((provider) => provider.isCustom)
                  .map((provider) => (
                    <SelectItem
                      key={provider.id}
                      value={provider.id}
                      className="cursor-pointer hover:bg-accent/50"
                    >
                      <span className="font-medium">{provider.name}</span>
                    </SelectItem>
                  ))}
              </>
            )}
          </SelectContent>
        </Select>

        {/* Status indicator */}
        {selectedSpeechProvider && (
          <div className="mt-2 p-2 rounded-md border border-input/30">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConfigured ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span className="text-xs font-medium">
                {selectedSpeechProvider.name}
              </span>
              <span
                className={`text-xs ${
                  isConfigured ? "text-green-600" : "text-yellow-600"
                }`}
              >
                {isConfigured ? "Ready" : "Configuration needed"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
