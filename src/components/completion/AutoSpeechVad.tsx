import {
  transcribeAudio,
  transcribeAudioWithProvider,
  loadSpeechProvidersFromStorage,
  loadSelectedSpeechProvider,
  isSelectedSpeechProviderConfigured,
} from "@/lib";
import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  submit,
  setState,
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      try {
        setIsTranscribing(true);

        // Check if we have a configured speech provider
        const selectedSpeechProvider = loadSelectedSpeechProvider();

        if (!selectedSpeechProvider) {
          console.warn("No speech provider selected");
          setState((prev) => ({
            ...prev,
            error:
              "No speech provider selected. Please select one in settings.",
          }));
          return;
        }

        if (!isSelectedSpeechProviderConfigured()) {
          console.warn("Selected speech provider not configured");
          setState((prev) => ({
            ...prev,
            error:
              "Speech provider not configured. Please configure it in settings.",
          }));
          return;
        }

        const speechProviders = loadSpeechProvidersFromStorage();
        const providerConfig = speechProviders.find(
          (p) => p.id === selectedSpeechProvider.id
        );

        if (!providerConfig) {
          console.warn("Selected speech provider configuration not found");
          setState((prev) => ({
            ...prev,
            error:
              "Speech provider configuration not found. Please check your settings.",
          }));
          return;
        }

        // Get the API key to use
        let apiKeyToUse = selectedSpeechProvider.apiKey;

        // For OpenAI Whisper, try to use OpenAI AI provider's API key if no specific key is set
        if (
          selectedSpeechProvider.id === "openai-whisper" &&
          (!apiKeyToUse || apiKeyToUse.trim().length === 0)
        ) {
          const { getSettings } = await import("@/lib");
          const settings = getSettings();
          if (
            settings?.selectedProvider === "openai" &&
            settings?.apiKey &&
            settings.apiKey.trim().length > 0
          ) {
            apiKeyToUse = settings.apiKey;
          }
        }

        if (!apiKeyToUse || apiKeyToUse.trim().length === 0) {
          console.warn("No valid API key available for speech provider");
          setState((prev) => ({
            ...prev,
            error:
              "No valid API key available for speech provider. Please configure it in settings.",
          }));
          return;
        }

        let transcription: string;

        // Use the appropriate transcription method
        if (selectedSpeechProvider.id === "openai-whisper") {
          // Use the original OpenAI transcription function
          transcription = await transcribeAudio(audio, apiKeyToUse);
        } else {
          // Use the generic transcription function for custom providers
          transcription = await transcribeAudioWithProvider(
            audio,
            providerConfig,
            apiKeyToUse
          );
        }

        if (transcription) {
          submit(transcription);
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  return (
    <>
      <Button
        size="icon"
        onClick={() => {
          if (vad.listening) {
            vad.pause();
            setEnableVAD(false);
          } else {
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
