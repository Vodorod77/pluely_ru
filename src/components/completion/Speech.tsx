import { getSettings, transcribeAudio } from "@/lib";
import { CompletionState } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";

export const Speech = ({
  submit,
  setState,
  setEnableVAD,
}: {
  submit: (transcription: string) => void;
  setState: React.Dispatch<React.SetStateAction<CompletionState>>;
  setEnableVAD: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    onSpeechEnd: async (audio) => {
      try {
        setIsTranscribing(true);
        const settings = getSettings();

        // Check if we have an OpenAI API key for transcription
        let openAiKey = "";
        if (settings.selectedProvider === "openai") {
          // Use the main API key if provider is OpenAI
          if (!settings?.apiKey || !settings?.isApiKeySubmitted) {
            console.warn("No OpenAI API key configured for transcription");
            return;
          }
          openAiKey = settings.apiKey;
        } else {
          // Use the separate OpenAI key for non-OpenAI providers
          if (!settings?.openAiApiKey || !settings?.isOpenAiApiKeySubmitted) {
            console.warn("No OpenAI API key configured for speech-to-text");
            return;
          }
          openAiKey = settings.openAiApiKey;
        }

        const transcription = await transcribeAudio(audio, openAiKey);
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
