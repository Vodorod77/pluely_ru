import {
  AI_PROVIDERS,
  DEFAULT_SYSTEM_PROMPT,
  SPEECH_TO_TEXT_PROVIDERS,
  STORAGE_KEYS,
} from "@/config";
import { safeLocalStorage } from "@/lib";
import { IContextType, ScreenshotConfig, TYPE_PROVIDER } from "@/types";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Create the context
const AppContext = createContext<IContextType | undefined>(undefined);

// Create the provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    safeLocalStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) ||
      DEFAULT_SYSTEM_PROMPT
  );

  // AI Providers
  const [customAiProviders, setCustomAiProviders] = useState<TYPE_PROVIDER[]>(
    []
  );
  const [selectedAIProvider, setSelectedAIProvider] = useState<{
    provider: string;
    variables: Record<string, string>;
  }>({
    provider: "",
    variables: {},
  });

  // STT Providers
  const [customSttProviders, setCustomSttProviders] = useState<TYPE_PROVIDER[]>(
    []
  );
  const [selectedSttProvider, setSelectedSttProvider] = useState<{
    provider: string;
    variables: Record<string, string>;
  }>({
    provider: "",
    variables: {},
  });

  const [screenshotConfiguration, setScreenshotConfiguration] =
    useState<ScreenshotConfig>({
      mode: "manual",
      autoPrompt: "Analyze this screenshot and provide insights",
      enabled: true,
    });

  // Function to load AI, STT, system prompt and screenshot config data from storage
  const loadData = () => {
    // Load system prompt
    const savedSystemPrompt = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_PROMPT
    );
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt || DEFAULT_SYSTEM_PROMPT);
    }

    // Load screenshot configuration
    const savedScreenshotConfig = safeLocalStorage.getItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG
    );
    if (savedScreenshotConfig) {
      try {
        const parsed = JSON.parse(savedScreenshotConfig);
        if (typeof parsed === "object" && parsed !== null) {
          setScreenshotConfiguration({
            mode: parsed.mode || "manual",
            autoPrompt:
              parsed.autoPrompt ||
              "Analyze this screenshot and provide insights",
            enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          });
        }
      } catch {
        console.warn("Failed to parse screenshot configuration");
      }
    }

    // Load custom AI providers
    const savedAi = safeLocalStorage.getItem(STORAGE_KEYS.CUSTOM_AI_PROVIDERS);
    let aiList: TYPE_PROVIDER[] = [];
    if (savedAi) {
      try {
        const parsed = JSON.parse(savedAi);
        if (Array.isArray(parsed)) {
          aiList = parsed.map((p) => ({ ...p, isCustom: true }));
        }
      } catch {
        console.warn("Failed to parse custom AI providers");
      }
    }
    setCustomAiProviders(aiList);

    // Load custom AI providers
    const savedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS
    );
    let sttList: TYPE_PROVIDER[] = [];
    if (savedStt) {
      try {
        const parsed = JSON.parse(savedStt);
        if (Array.isArray(parsed)) {
          sttList = parsed.map((p) => ({ ...p, isCustom: true }));
        }
      } catch {
        console.warn("Failed to parse custom AI providers");
      }
    }
    setCustomSttProviders(sttList);

    // Load selected AI provider
    const savedSelectedAi = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_AI_PROVIDER
    );
    if (savedSelectedAi) {
      setSelectedAIProvider(JSON.parse(savedSelectedAi));
    }

    // Load selected STT provider
    const savedSelectedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_STT_PROVIDER
    );
    if (savedSelectedStt) {
      setSelectedSttProvider(JSON.parse(savedSelectedStt));
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Listen to storage events for real-time sync (e.g., multi-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.CUSTOM_AI_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_AI_PROVIDER ||
        e.key === STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_STT_PROVIDER ||
        e.key === STORAGE_KEYS.SYSTEM_PROMPT ||
        e.key === STORAGE_KEYS.SCREENSHOT_CONFIG
      ) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync selected AI to localStorage
  useEffect(() => {
    if (selectedAIProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_AI_PROVIDER,
        JSON.stringify(selectedAIProvider)
      );
    }
  }, [selectedAIProvider]);

  // Sync selected STT to localStorage
  useEffect(() => {
    if (selectedSttProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_STT_PROVIDER,
        JSON.stringify(selectedSttProvider)
      );
    }
  }, [selectedSttProvider]);

  // Computed all AI providers
  const allAiProviders: TYPE_PROVIDER[] = [
    ...AI_PROVIDERS,
    ...customAiProviders,
  ];

  // Computed all STT providers
  const allSttProviders: TYPE_PROVIDER[] = [
    ...SPEECH_TO_TEXT_PROVIDERS,
    ...customSttProviders,
  ];

  const onSetSelectedAIProvider = ({
    provider,
    variables,
  }: {
    provider: string;
    variables: Record<string, string>;
  }) => {
    if (provider && !allAiProviders.some((p) => p.id === provider)) {
      console.warn(`Invalid AI provider ID: ${provider}`);
      return;
    }

    setSelectedAIProvider((prev) => ({
      ...prev,
      provider,
      variables,
    }));
  };

  // Setter for selected STT with validation
  const onSetSelectedSttProvider = ({
    provider,
    variables,
  }: {
    provider: string;
    variables: Record<string, string>;
  }) => {
    if (provider && !allSttProviders.some((p) => p.id === provider)) {
      console.warn(`Invalid STT provider ID: ${provider}`);
      return;
    }

    setSelectedSttProvider((prev) => ({ ...prev, provider, variables }));
  };

  // Create the context value (extend IContextType accordingly)
  const value: IContextType = {
    systemPrompt,
    setSystemPrompt,
    allAiProviders,
    customAiProviders,
    selectedAIProvider,
    onSetSelectedAIProvider,
    allSttProviders,
    customSttProviders,
    selectedSttProvider,
    onSetSelectedSttProvider,
    screenshotConfiguration,
    setScreenshotConfiguration,
    loadData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a hook to access the context
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
};
