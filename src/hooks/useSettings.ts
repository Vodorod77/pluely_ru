import { useEffect, useState } from "react";
import { useWindowResize } from "@/hooks";
import { useApp } from "@/contexts";
import { extractVariables, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

export const useSettings = () => {
  const {
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
  } = useApp();
  const { resizeWindow } = useWindowResize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [variables, setVariables] = useState<{ key: string; value: string }[]>(
    []
  );
  const [sttVariables, setSttVariables] = useState<
    {
      key: string;
      value: string;
    }[]
  >([]);

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  const handleScreenshotModeChange = (value: "auto" | "manual") => {
    const newConfig = { ...screenshotConfiguration, mode: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotPromptChange = (value: string) => {
    const newConfig = { ...screenshotConfiguration, autoPrompt: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotEnabledChange = (enabled: boolean) => {
    const newConfig = { ...screenshotConfiguration, enabled };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  useEffect(() => {
    if (selectedAIProvider.provider) {
      const provider = allAiProviders.find(
        (p) => p.id === selectedAIProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        setVariables(variables);
      }
    }
  }, [selectedAIProvider.provider]);

  useEffect(() => {
    if (selectedSttProvider.provider) {
      const provider = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        setSttVariables(variables);
      }
    }
  }, [selectedSttProvider.provider]);

  // useEffect(() => {
  //   // Update the previous provider reference
  //   const prevProvider = prevAIProviderRef.current;
  //   prevAIProviderRef.current = selectedAIProvider.provider;

  //   // Handle case when switching FROM openai to another provider
  //   if (
  //     prevProvider === "openai" &&
  //     selectedAIProvider.provider !== "openai" &&
  //     selectedSttProvider.provider === "openai-whisper"
  //   ) {
  //     // Reset STT provider when AI provider is changed from openai
  //     setLocalSTTApiKey("");
  //     onSetSelectedSttProvider({
  //       provider: "",
  //       apiKey: "",
  //       model: "",
  //     });
  //     return;
  //   }

  //   // Handle case when AI provider is openai and STT is openai-whisper
  //   if (
  //     selectedAIProvider.provider === "openai" &&
  //     selectedSttProvider.provider === "openai-whisper"
  //   ) {
  //     const provider = SPEECH_TO_TEXT_PROVIDERS.find(
  //       (p) => p.id === "openai-whisper"
  //     );

  //     setLocalSTTApiKey(selectedSttProvider.apiKey);
  //     submitSTTApiKey();
  //     onSetSelectedSttProvider({
  //       ...selectedSttProvider,
  //       apiKey: selectedAIProvider.variables.api_key,
  //       model: provider?.request.fields.model || "whisper-1",
  //     });
  //   }
  // }, [
  //   selectedAIProvider.variables.api_key,
  //   selectedAIProvider.provider,
  //   selectedSttProvider.provider,
  // ]);

  // Auto-close on focus loss disabled to prevent interruptions during form interactions
  // Settings should be closed manually via the toggle button for better UX
  // useWindowFocus({
  //   onFocusLost: () => {
  //     setIsPopoverOpen(false);
  //   },
  // });

  const handleDeleteAllChatsConfirm = () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    setShowDeleteConfirmDialog(false);
  };

  return {
    isPopoverOpen,
    setIsPopoverOpen,
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotModeChange,
    handleScreenshotPromptChange,
    handleScreenshotEnabledChange,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
    handleDeleteAllChatsConfirm,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    variables,
    sttVariables,
  };
};
