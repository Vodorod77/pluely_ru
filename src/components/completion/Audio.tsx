import { MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { AutoSpeechVAD } from "./AutoSpeechVad";
import { UseCompletionReturn } from "@/types";
import {
  loadSettingsFromStorage,
  loadSelectedSpeechProvider,
  isSelectedSpeechProviderConfigured,
} from "@/lib";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  const settings = loadSettingsFromStorage();

  const getSpeechProviderStatus = () => {
    const selectedSpeechProvider = loadSelectedSpeechProvider();

    if (!selectedSpeechProvider) {
      return { available: false, error: "No speech provider selected" };
    }

    // Check if the selected provider is configured
    if (!isSelectedSpeechProviderConfigured()) {
      if (selectedSpeechProvider.id === "openai-whisper") {
        return { available: false, error: "OpenAI API key not configured" };
      }
      return {
        available: false,
        error: `${selectedSpeechProvider.name} not configured`,
      };
    }

    return { available: true };
  };

  const speechProviderStatus = getSpeechProviderStatus();
  const isSpeechProviderAvailable = () => speechProviderStatus.available;

  const getCurrentSpeechProviderName = () => {
    const selectedSpeechProvider = loadSelectedSpeechProvider();
    return selectedSpeechProvider?.name || "Speech Provider";
  };

  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        {isSpeechProviderAvailable() && enableVAD ? (
          <AutoSpeechVAD
            submit={submit}
            setState={setState}
            setEnableVAD={setEnableVAD}
          />
        ) : (
          <Button
            size="icon"
            onClick={() => {
              setEnableVAD(!enableVAD);
            }}
            className="cursor-pointer"
            title="Toggle voice input"
          >
            <MicIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        className={`w-80 p-3 ${isSpeechProviderAvailable() ? "hidden" : ""}`}
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Configuration Required
          </div>
          <p className="text-muted-foreground">
            {speechProviderStatus.error ? (
              <>
                <span className="block text-xs text-red-600 font-medium">
                  ⚠️ {speechProviderStatus.error}
                </span>
                <span className="block mt-2">
                  Please go to settings and configure your speech provider to
                  enable voice input.
                </span>
              </>
            ) : (
              <>
                Speech-to-text requires a configured speech provider. Please go
                to settings and configure a speech provider to enable voice
                input.
                {settings.selectedSpeechProvider && (
                  <span className="block mt-1 text-xs">
                    Selected: {getCurrentSpeechProviderName()}
                  </span>
                )}
              </>
            )}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
