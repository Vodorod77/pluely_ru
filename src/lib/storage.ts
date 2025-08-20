import { SettingsState, ChatConversation, CustomProvider } from "@/types";
import { STORAGE_KEYS, DEFAULT_SYSTEM_PROMPT } from "@/config";

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
