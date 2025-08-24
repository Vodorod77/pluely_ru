import {
  SettingsState,
  ChatConversation,
  CustomProvider,
  ScreenshotConfig,
  SpeechProvider,
} from "@/types";
import { STORAGE_KEYS, DEFAULT_SYSTEM_PROMPT, speechProviders } from "@/config";

const defaultScreenshotConfig: ScreenshotConfig = {
  mode: "manual",
  autoPrompt: "Analyze this screenshot and provide insights",
  enabled: true,
};

const defaultSettings: SettingsState = {
  selectedProvider: "",
  apiKey: "",
  isApiKeySubmitted: false,
  selectedModel: "",
  customModel: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  availableModels: [],
  isLoadingModels: false,
  modelsFetchError: null,
  openAiApiKey: "",
  isOpenAiApiKeySubmitted: false,
  screenshotConfig: defaultScreenshotConfig,
  selectedSpeechProvider: "",
  speechProviders: [],
  isSpeechProviderSubmitted: false,
};

export const loadSettingsFromStorage = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};

export const saveSettingsToStorage = (settings: SettingsState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Chat history storage functions
export const loadChatHistory = (): ChatConversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load chat history from localStorage:", error);
    return [];
  }
};

export const saveChatHistory = (conversations: ChatConversation[]) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Failed to save chat history to localStorage:", error);
  }
};

export const saveConversation = (conversation: ChatConversation) => {
  const conversations = loadChatHistory();
  const existingIndex = conversations.findIndex(
    (c) => c.id === conversation.id
  );

  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation); // Add to beginning
  }

  // Keep only the last 50 conversations to prevent storage bloat
  const limitedConversations = conversations.slice(0, 50);
  saveChatHistory(limitedConversations);
};

export const getConversation = (
  conversationId: string
): ChatConversation | null => {
  const conversations = loadChatHistory();
  return conversations.find((c) => c.id === conversationId) || null;
};

export const deleteConversation = (conversationId: string) => {
  const conversations = loadChatHistory();
  const filtered = conversations.filter((c) => c.id !== conversationId);
  saveChatHistory(filtered);
};

export const deleteAllConversations = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    return true;
  } catch (error) {
    console.error(
      "Failed to delete all conversations from localStorage:",
      error
    );
    return false;
  }
};

export const generateConversationTitle = (firstMessage: string): string => {
  // Generate a title from the first message, truncated to 50 characters
  const cleaned = firstMessage.replace(/\n/g, " ").trim();
  return cleaned.length > 50 ? cleaned.substring(0, 47) + "..." : cleaned;
};

// Custom provider storage functions
export const loadCustomProvidersFromStorage = (): CustomProvider[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROVIDERS);
    const parsed = stored ? JSON.parse(stored) : [];
    return parsed;
  } catch (error) {
    console.error("Failed to load custom providers from localStorage:", error);
    return [];
  }
};

export const saveCustomProvidersToStorage = (providers: CustomProvider[]) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_PROVIDERS,
      JSON.stringify(providers)
    );

    // Verify it was saved correctly
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROVIDERS);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Failed to save custom providers to localStorage:", error);
  }
};

export const addCustomProvider = (provider: CustomProvider) => {
  const providers = loadCustomProvidersFromStorage();
  const existingIndex = providers.findIndex((p) => p.id === provider.id);

  if (existingIndex >= 0) {
    providers[existingIndex] = provider;
  } else {
    providers.push(provider);
  }

  saveCustomProvidersToStorage(providers);
};

export const deleteCustomProvider = (providerId: string) => {
  const providers = loadCustomProvidersFromStorage();

  const filtered = providers.filter((p) => p.id !== providerId);
  saveCustomProvidersToStorage(filtered);
};

export const getCustomProvider = (
  providerId: string
): CustomProvider | null => {
  const providers = loadCustomProvidersFromStorage();
  return providers.find((p) => p.id === providerId) || null;
};

// Screenshot config storage functions
export const loadScreenshotConfig = (): ScreenshotConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SCREENSHOT_CONFIG);
    if (stored) {
      return { ...defaultScreenshotConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load screenshot config from localStorage:", error);
  }
  return defaultScreenshotConfig;
};

export const saveScreenshotConfig = (config: ScreenshotConfig) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(config)
    );
  } catch (error) {
    console.error("Failed to save screenshot config to localStorage:", error);
  }
};

// Speech provider storage functions
export const loadSpeechProvidersFromStorage = (): SpeechProvider[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDERS);
    if (stored) {
      const parsed = JSON.parse(stored);
      const merged: SpeechProvider[] = [...speechProviders];
      parsed.forEach((provider: any) => {
        const existingIndex = merged.findIndex((p) => p.id === provider.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = { ...merged[existingIndex], ...provider };
        } else {
          // Create a properly typed provider
          const typedProvider: SpeechProvider = {
            id: provider.id || `custom-${Date.now()}`,
            name: provider.name || "Custom Provider",
            baseUrl: provider.baseUrl || "",
            endpoint: provider.endpoint || "",
            method: provider.method || "POST",
            authType: provider.authType || "bearer",
            authParam: provider.authParam,
            customHeaderName: provider.customHeaderName,
            apiKey: provider.apiKey,
            request: {
              audioFormat: provider.request?.audioFormat || "wav",
              audioFieldName: provider.request?.audioFieldName || "file",
              additionalFields: provider.request?.additionalFields || {},
            },
            response: {
              contentPath: provider.response?.contentPath || "",
              exampleStructure: provider.response?.exampleStructure || {},
            },
            isCustom: provider.isCustom !== false,
            supportsStreaming: provider.supportsStreaming || false,
            additionalHeaders: provider.additionalHeaders || {},
          };
          merged.push(typedProvider);
        }
      });
      return merged;
    }
  } catch (error) {
    console.error("Failed to load speech providers from localStorage:", error);
  }

  // Return default providers
  return speechProviders;
};

export const saveSpeechProvidersToStorage = (providers: SpeechProvider[]) => {
  try {
    // Only save custom providers, not the defaults
    const customProviders = providers.filter((p) => p.isCustom);
    localStorage.setItem(
      STORAGE_KEYS.SPEECH_PROVIDERS,
      JSON.stringify(customProviders)
    );
  } catch (error) {
    console.error("Failed to save speech providers to localStorage:", error);
  }
};

export const addSpeechProvider = (provider: SpeechProvider) => {
  const providers = loadSpeechProvidersFromStorage();
  const existingIndex = providers.findIndex((p) => p.id === provider.id);

  if (existingIndex >= 0) {
    providers[existingIndex] = provider;
  } else {
    providers.push(provider);
  }

  saveSpeechProvidersToStorage(providers);
};

export const deleteSpeechProvider = (providerId: string) => {
  const providers = loadSpeechProvidersFromStorage();
  const filtered = providers.filter((p) => p.id !== providerId);
  saveSpeechProvidersToStorage(filtered);
};

export const getSpeechProvider = (
  providerId: string
): SpeechProvider | null => {
  const providers = loadSpeechProvidersFromStorage();
  return providers.find((p) => p.id === providerId) || null;
};

export const updateSpeechProviderApiKey = (
  providerId: string,
  apiKey: string
) => {
  const providers = loadSpeechProvidersFromStorage();
  const providerIndex = providers.findIndex((p) => p.id === providerId);

  if (providerIndex >= 0) {
    providers[providerIndex] = { ...providers[providerIndex], apiKey };
    saveSpeechProvidersToStorage(providers);
  }
};

export interface SelectedSpeechProvider {
  id: string;
  name: string;
  isConfigured: boolean;
  apiKey?: string;
}

export const loadSelectedSpeechProvider = (): SelectedSpeechProvider | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_SPEECH_PROVIDER);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(
      "Failed to load selected speech provider from localStorage:",
      error
    );
    return null;
  }
};

export const saveSelectedSpeechProvider = (
  provider: SelectedSpeechProvider | null
) => {
  try {
    if (provider) {
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_SPEECH_PROVIDER,
        JSON.stringify(provider)
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_SPEECH_PROVIDER);
    }
  } catch (error) {
    console.error(
      "Failed to save selected speech provider to localStorage:",
      error
    );
  }
};

export const setSelectedSpeechProvider = (
  providerId: string,
  apiKey?: string
) => {
  const allProviders = loadSpeechProvidersFromStorage();
  const provider = allProviders.find((p) => p.id === providerId);

  if (!provider) {
    console.error(`Speech provider with id ${providerId} not found`);
    return;
  }

  let isConfigured = false;
  let finalApiKey = apiKey || provider.apiKey;

  // Special case: For OpenAI Whisper, check if we can use existing OpenAI API key
  if (providerId === "openai-whisper" && !finalApiKey) {
    const settings = loadSettingsFromStorage();
    if (
      settings.selectedProvider === "openai" &&
      settings.isApiKeySubmitted &&
      settings.apiKey &&
      settings.apiKey.trim().length > 0
    ) {
      finalApiKey = settings.apiKey;
    }
  }

  // Standard handling for all providers
  if (provider.authType === "none") {
    isConfigured = true;
  } else {
    isConfigured = !!finalApiKey && finalApiKey.trim().length > 0;
  }

  const selectedProvider: SelectedSpeechProvider = {
    id: providerId,
    name: provider.name,
    isConfigured: isConfigured,
    apiKey: finalApiKey,
  };

  saveSelectedSpeechProvider(selectedProvider);
};

export const clearSelectedSpeechProvider = () => {
  saveSelectedSpeechProvider(null);
};

export const isSelectedSpeechProviderConfigured = (): boolean => {
  const selectedProvider = loadSelectedSpeechProvider();
  if (!selectedProvider) return false;

  // For providers with no auth required
  const allProviders = loadSpeechProvidersFromStorage();
  const providerConfig = allProviders.find((p) => p.id === selectedProvider.id);
  if (providerConfig?.authType === "none") {
    return true;
  }

  // For OpenAI Whisper, check if we can use existing OpenAI API key
  if (selectedProvider.id === "openai-whisper") {
    // Check if it has its own API key
    if (selectedProvider.apiKey && selectedProvider.apiKey.trim().length > 0) {
      return true;
    }
    // Check if we can use OpenAI AI provider's API key
    const settings = loadSettingsFromStorage();
    return (
      settings.selectedProvider === "openai" &&
      settings.isApiKeySubmitted &&
      !!settings.apiKey &&
      settings.apiKey.trim().length > 0
    );
  }

  // Standard validation for other providers
  return (
    selectedProvider.isConfigured &&
    !!selectedProvider.apiKey &&
    selectedProvider.apiKey.trim().length > 0
  );
};
