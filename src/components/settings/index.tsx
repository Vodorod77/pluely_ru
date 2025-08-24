import { useState, useEffect } from "react";
import { useWindowResize } from "@/hooks";
import { SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { ProviderSelection } from "./ProviderSelection";
import { ApiKeyInput } from "./ApiKeyInput";
import { ModelSelection } from "./ModelSelection";
import { Disclaimer } from "./Disclaimer";
import { SystemPrompt } from "./SystemPrompt";

import { CustomProviderComponent } from "../custom-provider";
import { SpeechProviderComponent } from "./speech-providers";
import { SpeechProviderApiKeyInput } from "./speech-providers/ApiKeyInput";
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  fetchModels,
  getProviderById,
  loadSpeechProvidersFromStorage,
  addSpeechProvider,
  deleteSpeechProvider,
  updateSpeechProviderApiKey,
  setSelectedSpeechProvider,
  clearSelectedSpeechProvider,
} from "@/lib";
import { SettingsState, SpeechProvider, SpeechProviderFormData } from "@/types";
import { useCustomProvider } from "@/hooks";
import { ScreenshotConfigs } from "./ScreenshotConfigs";
import { DeleteChats } from "./DeleteChats";
export const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>(
    loadSettingsFromStorage
  );
  const { resizeWindow } = useWindowResize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [refreshProviders, setRefreshProviders] = useState(0);

  // Speech provider management
  const [speechProviders, setSpeechProviders] = useState<SpeechProvider[]>(
    loadSpeechProvidersFromStorage
  );
  const [showSpeechForm, setShowSpeechForm] = useState(false);
  const [editingSpeechProvider, setEditingSpeechProvider] = useState<
    string | null
  >(null);
  const [speechFormData, setSpeechFormData] = useState<SpeechProviderFormData>({
    name: "",
    baseUrl: "",
    endpoint: "",
    method: "POST",
    authType: "bearer",
    authParam: "",
    customHeaderName: "",
    audioFormat: "wav",
    audioFieldName: "file",
    contentPath: "",
    additionalFields: {},
    additionalHeaders: {},
    supportsStreaming: false,
  });
  const [speechErrors, setSpeechErrors] = useState<{ [key: string]: string }>(
    {}
  );
  const [speechSaveError, setSpeechSaveError] = useState<string | null>(null);
  const [speechDeleteConfirm, setSpeechDeleteConfirm] = useState<string | null>(
    null
  );

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleApiKeySubmit = async () => {
    if (!settings.apiKey.trim()) return;

    const provider = getProviderById(settings.selectedProvider);
    if (!provider) return;

    // Mark API key as submitted first
    updateSettings({
      isApiKeySubmitted: true,
      isLoadingModels: false,
      modelsFetchError: null,
      availableModels: [],
    });

    // No special handling for OpenAI - treat it like any other AI provider
    // Users can manually select OpenAI Whisper if they want to use it

    // Try to fetch models if provider supports it (custom providers don't have models endpoint)
    if (provider.models && !provider.isCustom) {
      updateSettings({ isLoadingModels: true });

      try {
        const models = await fetchModels(provider, settings.apiKey.trim());
        updateSettings({
          isLoadingModels: false,
          availableModels: models,
          modelsFetchError: null,
          // Clear selected model if it's not in the fetched models
          selectedModel: models.includes(settings.selectedModel)
            ? settings.selectedModel
            : "",
        });
      } catch (error) {
        updateSettings({
          isLoadingModels: false,
          modelsFetchError:
            error instanceof Error ? error.message : "Failed to fetch models",
          availableModels: [],
        });
      }
    } else if (
      provider.isCustom &&
      provider.defaultModel &&
      !settings.customModel
    ) {
      // For custom providers, auto-fill the default model if none is set
      updateSettings({
        customModel: provider.defaultModel,
      });
    }
  };

  const handleApiKeyDelete = () => {
    updateSettings({
      apiKey: "",
      isApiKeySubmitted: false,
      selectedModel: "",
      customModel: "",
      availableModels: [],
      isLoadingModels: false,
      modelsFetchError: null,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApiKeySubmit();
    }
  };

  const currentProvider = getProviderById(settings.selectedProvider);

  // Speech provider handlers
  const resetSpeechForm = () => {
    setShowSpeechForm(false);
    setEditingSpeechProvider(null);
    setSpeechFormData({
      name: "",
      baseUrl: "",
      endpoint: "",
      method: "POST",
      authType: "bearer",
      authParam: "",
      customHeaderName: "",
      audioFormat: "wav",
      audioFieldName: "file",
      contentPath: "",
      additionalFields: {},
      additionalHeaders: {},
      supportsStreaming: false,
    });
    setSpeechErrors({});
    setSpeechSaveError(null);
  };

  const handleSpeechProviderEdit = (provider: SpeechProvider) => {
    setEditingSpeechProvider(provider.id);
    setSpeechFormData({
      name: provider.name,
      baseUrl: provider.baseUrl,
      endpoint: provider.endpoint,
      method: provider.method,
      authType: provider.authType,
      authParam: provider.authParam || "",
      customHeaderName: provider.customHeaderName || "",
      audioFormat: provider.request.audioFormat,
      audioFieldName: provider.request.audioFieldName,
      contentPath: provider.response.contentPath,
      additionalFields: provider.request.additionalFields || {},
      additionalHeaders: provider.additionalHeaders || {},
      supportsStreaming: provider.supportsStreaming || false,
    });
    setShowSpeechForm(true);
  };

  const handleSpeechProviderSave = () => {
    setSpeechErrors({});
    setSpeechSaveError(null);

    // Validation
    const errors: { [key: string]: string } = {};

    if (!speechFormData.name.trim()) errors.name = "Name is required";
    if (!speechFormData.baseUrl.trim()) errors.baseUrl = "Base URL is required";
    if (!speechFormData.endpoint.trim())
      errors.endpoint = "Endpoint is required";
    if (!speechFormData.audioFormat.trim())
      errors.audioFormat = "Audio format is required";
    if (!speechFormData.audioFieldName.trim())
      errors.audioFieldName = "Audio field name is required";

    if (Object.keys(errors).length > 0) {
      setSpeechErrors(errors);
      return;
    }

    try {
      const providerId = editingSpeechProvider || `custom-speech-${Date.now()}`;

      const newProvider: SpeechProvider = {
        id: providerId,
        name: speechFormData.name,
        baseUrl: speechFormData.baseUrl,
        endpoint: speechFormData.endpoint,
        method: speechFormData.method,
        authType: speechFormData.authType,
        authParam: speechFormData.authParam,
        customHeaderName: speechFormData.customHeaderName,
        request: {
          audioFormat: speechFormData.audioFormat,
          audioFieldName: speechFormData.audioFieldName,
          additionalFields: speechFormData.additionalFields,
        },
        response: {
          contentPath: speechFormData.contentPath,
          exampleStructure: {},
        },
        isCustom: true,
        supportsStreaming: speechFormData.supportsStreaming,
        additionalHeaders: speechFormData.additionalHeaders,
      };

      addSpeechProvider(newProvider);
      setSpeechProviders(loadSpeechProvidersFromStorage());
      resetSpeechForm();
    } catch (error) {
      setSpeechSaveError(
        error instanceof Error ? error.message : "Failed to save provider"
      );
    }
  };

  const handleSpeechProviderDelete = (id: string) => {
    setSpeechDeleteConfirm(id);
  };

  const confirmSpeechProviderDelete = () => {
    if (speechDeleteConfirm) {
      deleteSpeechProvider(speechDeleteConfirm);
      setSpeechProviders(loadSpeechProvidersFromStorage());

      // If the deleted provider was selected, reset selection
      if (settings.selectedSpeechProvider === speechDeleteConfirm) {
        updateSettings({
          selectedSpeechProvider: "",
          isSpeechProviderSubmitted: false,
        });
      }
    }
    setSpeechDeleteConfirm(null);
  };

  const cancelSpeechProviderDelete = () => {
    setSpeechDeleteConfirm(null);
  };

  const handleProviderAdded = () => {
    setRefreshProviders((prev) => prev + 1);
  };

  const customProviders = useCustomProvider(handleProviderAdded);

  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  // Auto-close on focus loss disabled to prevent interruptions during form interactions
  // Settings should be closed manually via the toggle button for better UX
  // useWindowFocus({
  //   onFocusLost: () => {
  //     setIsPopoverOpen(false);
  //   },
  // });

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          aria-label="Open Settings"
          className="cursor-pointer [data-state=open]:bg-[red]"
          title="Open Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      {/* Settings Panel */}
      <PopoverContent
        align="end"
        side="bottom"
        className="select-none w-screen p-0 border overflow-hidden border-input/50"
        sideOffset={8}
      >
        <ScrollArea className="h-[calc(100vh-7rem)]">
          <div className="p-6 space-y-4">
            {/* System Prompt */}
            <SystemPrompt
              value={settings.systemPrompt}
              onChange={(value) => updateSettings({ systemPrompt: value })}
            />
            {/* Screenshot Configs */}
            <ScreenshotConfigs />

            {/* Configuration Header */}
            <div className="border-b border-input/50 pb-2 mt-6">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI Configuration
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure your AI provider, authentication, and model
                preferences for the best experience.
              </p>
            </div>

            {/* Custom Providers Configuration */}
            <CustomProviderComponent {...customProviders} />

            {/* AI Provider Selection */}
            <ProviderSelection
              value={settings.selectedProvider}
              onChange={(value) => {
                const selectedProvider = getProviderById(value);
                const defaultModel = selectedProvider?.isCustom
                  ? selectedProvider.defaultModel || ""
                  : "";

                // Clear selected speech provider when switching AI providers
                clearSelectedSpeechProvider();

                updateSettings({
                  selectedProvider: value,
                  apiKey: "",
                  isApiKeySubmitted: false,
                  selectedModel: "",
                  customModel: defaultModel,
                  availableModels: [],
                  isLoadingModels: false,
                  modelsFetchError: null,
                  selectedSpeechProvider: "",
                  isSpeechProviderSubmitted: false,
                });
              }}
              refreshKey={refreshProviders}
            />

            {/* API Key Configuration */}
            <ApiKeyInput
              providerName={currentProvider?.name || ""}
              value={settings.apiKey}
              onChange={(value) => updateSettings({ apiKey: value })}
              onSubmit={handleApiKeySubmit}
              onDelete={handleApiKeyDelete}
              onKeyPress={handleKeyPress}
              isSubmitted={settings.isApiKeySubmitted}
            />

            {/* Model Selection */}
            <ModelSelection
              provider={settings.selectedProvider}
              selectedModel={settings.selectedModel}
              customModel={settings.customModel}
              onModelChange={(value) =>
                updateSettings({
                  selectedModel: value.replace("models/", ""),
                })
              }
              onCustomModelChange={(value) =>
                updateSettings({ customModel: value })
              }
              disabled={!settings.isApiKeySubmitted}
              availableModels={settings.availableModels}
              isLoadingModels={settings.isLoadingModels}
              modelsFetchError={settings.modelsFetchError}
            />

            {/* Speech-to-Text Configuration */}
            <SpeechProviderComponent
              speechProviders={speechProviders}
              selectedProvider={settings.selectedSpeechProvider}
              onProviderChange={(value) => {
                // Clear previous selection
                clearSelectedSpeechProvider();

                // Check if the selected provider already has configuration
                const speechProviders = loadSpeechProvidersFromStorage();
                const selectedProvider = speechProviders.find(
                  (p) => p.id === value
                );

                let isConfigured = false;
                let apiKeyToUse = "";

                if (selectedProvider) {
                  // Special case: If selecting OpenAI Whisper and OpenAI API key exists, use it
                  if (
                    value === "openai-whisper" &&
                    settings.selectedProvider === "openai" &&
                    settings.isApiKeySubmitted &&
                    settings.apiKey &&
                    settings.apiKey.trim().length > 0
                  ) {
                    apiKeyToUse = settings.apiKey;
                    isConfigured = true;
                  }
                  // Check if the provider has its own valid API key
                  else if (
                    selectedProvider.apiKey &&
                    selectedProvider.apiKey.trim().length > 0
                  ) {
                    apiKeyToUse = selectedProvider.apiKey;
                    isConfigured = true;
                  }
                  // Providers with no auth required
                  else if (selectedProvider.authType === "none") {
                    isConfigured = true;
                  }

                  // If provider is configured, set it as selected
                  if (isConfigured) {
                    setSelectedSpeechProvider(value, apiKeyToUse);
                  }
                }

                updateSettings({
                  selectedSpeechProvider: value,
                  isSpeechProviderSubmitted: isConfigured,
                });
              }}
              showForm={showSpeechForm}
              setShowForm={setShowSpeechForm}
              editingProvider={editingSpeechProvider}
              errors={speechErrors}
              saveError={speechSaveError}
              deleteConfirm={speechDeleteConfirm}
              formData={speechFormData}
              setFormData={setSpeechFormData}
              handleEdit={handleSpeechProviderEdit}
              handleSave={handleSpeechProviderSave}
              handleDelete={handleSpeechProviderDelete}
              confirmDelete={confirmSpeechProviderDelete}
              cancelDelete={cancelSpeechProviderDelete}
              resetForm={resetSpeechForm}
              refreshKey={refreshProviders}
            />

            {/* Speech Provider API Key Configuration */}
            {settings.selectedSpeechProvider &&
              (() => {
                const selectedProvider = speechProviders.find(
                  (p) => p.id === settings.selectedSpeechProvider
                );
                if (selectedProvider && selectedProvider.authType !== "none") {
                  // Special display for OpenAI Whisper when using existing OpenAI API key
                  if (
                    settings.selectedSpeechProvider === "openai-whisper" &&
                    settings.selectedProvider === "openai" &&
                    settings.isApiKeySubmitted &&
                    settings.apiKey &&
                    settings.apiKey.trim().length > 0 &&
                    (!selectedProvider.apiKey ||
                      selectedProvider.apiKey.trim().length === 0)
                  ) {
                    return (
                      <div className="space-y-3">
                        <div className="border-b border-input/50 pb-2">
                          <label className="text-sm font-semibold">
                            API Key Configuration
                          </label>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-green-700">
                              Using OpenAI API Key
                            </span>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            OpenAI Whisper is using your existing OpenAI API
                            key. No additional configuration needed.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <SpeechProviderApiKeyInput
                      provider={selectedProvider}
                      onSubmit={(providerId, apiKey) => {
                        updateSpeechProviderApiKey(providerId, apiKey);
                        setSelectedSpeechProvider(providerId, apiKey);
                        setSpeechProviders(loadSpeechProvidersFromStorage());
                        updateSettings({
                          selectedSpeechProvider: providerId,
                          isSpeechProviderSubmitted: true,
                        });
                        // Trigger refresh of speech provider components
                        setRefreshProviders((prev) => prev + 1);
                      }}
                      onDelete={(providerId) => {
                        updateSpeechProviderApiKey(providerId, "");
                        clearSelectedSpeechProvider();
                        setSpeechProviders(loadSpeechProvidersFromStorage());
                        if (settings.selectedSpeechProvider === providerId) {
                          updateSettings({
                            selectedSpeechProvider: providerId,
                            isSpeechProviderSubmitted: false,
                          });
                        }
                        // Trigger refresh of speech provider components
                        setRefreshProviders((prev) => prev + 1);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          const selectedProvider = speechProviders.find(
                            (p) => p.id === settings.selectedSpeechProvider
                          );
                          if (selectedProvider) {
                            const input = document.querySelector(
                              'input[type="password"]'
                            ) as HTMLInputElement;
                            if (input?.value.trim()) {
                              updateSpeechProviderApiKey(
                                selectedProvider.id,
                                input.value.trim()
                              );
                              setSpeechProviders(
                                loadSpeechProvidersFromStorage()
                              );
                              updateSettings({
                                selectedSpeechProvider: selectedProvider.id,
                                isSpeechProviderSubmitted: true,
                              });
                            }
                          }
                        }
                      }}
                      isSubmitted={settings.isSpeechProviderSubmitted}
                      disabled={false}
                    />
                  );
                }
                return null;
              })()}

            {/* Delete Chat History */}
            <DeleteChats />
          </div>

          <div className="pb-4 flex items-center justify-center">
            <a
              href="https://www.srikanthnani.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground text-center font-medium"
            >
              🚀 Built by Srikanth Nani ✨
            </a>
          </div>
        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </PopoverContent>
    </Popover>
  );
};
