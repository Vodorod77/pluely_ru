import { useEffect, useState } from "react";
import { useWindowResize } from "@/hooks";
import { useApp } from "@/contexts";
import { TYPE_AI_PROVIDER } from "@/types";
import { safeLocalStorage, fetchModels } from "@/lib";
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
  const [availableModels, setAvailableModels] = useState<{
    [providerId: string]: string[];
  }>({});
  const [modelsFetching, setModelsFetching] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(selectedAIProvider.apiKey);
  const [localSTTApiKey, setLocalSTTApiKey] = useState(
    selectedSttProvider.apiKey
  );

  // Sync local API key with global state when provider changes
  useEffect(() => {
    if (selectedAIProvider.apiKey) {
      setLocalApiKey(selectedAIProvider.apiKey);
    }

    if (selectedSttProvider.apiKey) {
      setLocalSTTApiKey(selectedSttProvider.apiKey);
    }
  }, [selectedAIProvider.provider, selectedSttProvider.provider]);

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

  const submitApiKey = () => {
    if (localApiKey.trim()) {
      onSetSelectedAIProvider({
        ...selectedAIProvider,
        apiKey: localApiKey.trim(),
      });
    }
  };

  const submitSTTApiKey = () => {
    if (localSTTApiKey.trim()) {
      onSetSelectedSttProvider({
        ...selectedSttProvider,
        apiKey: localSTTApiKey.trim(),
      });
    }
  };

  const fetchModelsForProvider = async (
    provider: TYPE_AI_PROVIDER,
    apiKey: string
  ) => {
    if (
      !provider ||
      (!apiKey &&
        allAiProviders.find((p) => p.id === selectedAIProvider.provider)
          ?.models)
    ) {
      return;
    }

    try {
      setModelsFetching(true);
      const models = await fetchModels({ provider, apiKey });
      setAvailableModels((prev) => ({
        ...prev,
        [provider.id]: models as string[],
      }));
      setModelsFetching(false);
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setModelsFetching(false);
    }
  };

  useEffect(() => {
    if (
      selectedAIProvider.apiKey &&
      selectedAIProvider.provider &&
      isPopoverOpen
    ) {
      const provider = allAiProviders.find(
        (p) => p.id === selectedAIProvider.provider
      );
      if (provider) {
        fetchModelsForProvider(provider, selectedAIProvider.apiKey);
      }
    }
  }, [selectedAIProvider.apiKey, isPopoverOpen, allAiProviders.length]);

  // Auto-close on focus loss disabled to prevent interruptions during form interactions
  // Settings should be closed manually via the toggle button for better UX
  // useWindowFocus({
  //   onFocusLost: () => {
  //     setIsPopoverOpen(false);
  //   },
  // });

  console.log("availableModels", availableModels);

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
    fetchModelsForProvider,
    availableModels,
    modelsFetching,
    localApiKey,
    setLocalApiKey,
    submitApiKey,
    localSTTApiKey,
    setLocalSTTApiKey,
    submitSTTApiKey,
  };
};
