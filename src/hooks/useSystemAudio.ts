import { useEffect, useState, useCallback, useRef } from "react";
import { useWindowResize, useGlobalShortcuts } from ".";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "@/contexts";
import { fetchSTT, fetchAIResponse } from "@/lib/functions";
import { DEFAULT_SYSTEM_PROMPT, STORAGE_KEYS } from "@/config";
import {
  generateConversationTitle,
  safeLocalStorage,
  saveConversation,
} from "@/lib";
import { shouldUsePluelyAPI } from "@/lib/functions/pluely.api";

// Audio settings type
export interface AudioSettings {
  vadSensitivity: number;
  speechThreshold: number;
  silenceThreshold: number;
  minSpeechDuration: number;
  preSpeechBufferSize: number;
}

// Chat message interface (reusing from useCompletion)
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

// Conversation interface (reusing from useCompletion)
export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Default settings
const DEFAULT_SETTINGS: AudioSettings = {
  vadSensitivity: 0.004,
  speechThreshold: 0.01,
  silenceThreshold: 47,
  minSpeechDuration: 15,
  preSpeechBufferSize: 15,
};

export type useSystemAudioType = ReturnType<typeof useSystemAudio>;

export function useSystemAudio() {
  const { resizeWindow } = useWindowResize();
  const globalShortcuts = useGlobalShortcuts();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>("");
  const [lastAIResponse, setLastAIResponse] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [testResults, setTestResults] = useState<string>("");

  const [conversation, setConversation] = useState<ChatConversation>({
    id: "",
    title: "",
    messages: [],
    createdAt: 0,
    updatedAt: 0,
  });

  // Context management states
  const [useSystemPrompt, setUseSystemPrompt] = useState<boolean>(true);
  const [contextContent, setContextContent] = useState<string>("");

  const {
    selectedSttProvider,
    allSttProviders,
    selectedAIProvider,
    allAiProviders,
    systemPrompt,
  } = useApp();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load context settings from localStorage on mount
  useEffect(() => {
    const savedContext = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_AUDIO_CONTEXT
    );
    if (savedContext) {
      try {
        const parsed = JSON.parse(savedContext);
        setUseSystemPrompt(parsed.useSystemPrompt ?? true);
        setContextContent(parsed.contextContent ?? "");
      } catch (error) {
        console.error("Failed to load system audio context:", error);
      }
    }
  }, []);

  // Check capture status on mount
  useEffect(() => {
    const checkCaptureStatus = async () => {
      try {
        const status = await invoke<string>("get_vad_status");

        // Parse the status to see if capturing is active
        if (status.includes("Capturing: true")) {
          setCapturing(true);
        }
      } catch (err) {}
    };
    if (!setupRequired && !isPopoverOpen) {
      checkCaptureStatus();
    }
  }, [setupRequired, isPopoverOpen]);

  // Handle speech detection events from Rust backend
  useEffect(() => {
    let speechStartUnlisten: (() => void) | undefined;
    let speechDetectedUnlisten: (() => void) | undefined;

    const setupEventListeners = async () => {
      try {
        // Listen for speech start events
        speechStartUnlisten = await listen("speech-start", () => {
          // Only clear error if still capturing
          if (capturing) {
            setError("");
          }
        });

        // Listen for speech detected events (with audio data)
        speechDetectedUnlisten = await listen(
          "speech-detected",
          async (event) => {
            try {
              // Early return if capturing is no longer active
              if (!capturing) {
                return;
              }

              const base64Audio = event.payload as string;

              // Convert base64 to blob
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([bytes], { type: "audio/wav" });

              const usePluelyAPI = await shouldUsePluelyAPI();
              // Check if we have a configured speech provider
              if (!selectedSttProvider.provider && !usePluelyAPI) {
                setError(
                  "No speech provider selected. Please select one in settings."
                );
                return;
              }

              const providerConfig = allSttProviders.find(
                (p) => p.id === selectedSttProvider.provider
              );

              if (!providerConfig && !usePluelyAPI) {
                setError(
                  "Speech provider configuration not found. Please check your settings."
                );
                return;
              }

              setIsProcessing(true);
              // Send to STT
              const transcription = await fetchSTT({
                provider: providerConfig,
                selectedProvider: selectedSttProvider,
                audio: audioBlob,
              });

              if (transcription && transcription.trim()) {
                setLastTranscription(transcription);
                setError("");

                // Determine which prompt to use based on user selection
                const effectiveSystemPrompt = useSystemPrompt
                  ? systemPrompt || DEFAULT_SYSTEM_PROMPT
                  : contextContent || DEFAULT_SYSTEM_PROMPT;

                // Send transcription to AI for processing
                await processWithAI(transcription, effectiveSystemPrompt);
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to process speech"
              );
            } finally {
              setIsProcessing(false);
            }
          }
        );
      } catch (err) {
        setError("Failed to setup audio event listeners");
      }
    };

    if (capturing) {
      setupEventListeners();
    }

    return () => {
      if (speechStartUnlisten) speechStartUnlisten();
      if (speechDetectedUnlisten) speechDetectedUnlisten();
    };
  }, [capturing, selectedSttProvider, allSttProviders]);

  // Context management functions
  const saveContextSettings = useCallback(
    (usePrompt: boolean, content: string) => {
      try {
        const contextSettings = {
          useSystemPrompt: usePrompt,
          contextContent: content,
        };
        safeLocalStorage.setItem(
          STORAGE_KEYS.SYSTEM_AUDIO_CONTEXT,
          JSON.stringify(contextSettings)
        );
      } catch (error) {
        console.error("Failed to save context settings:", error);
      }
    },
    []
  );

  const updateUseSystemPrompt = useCallback(
    (value: boolean) => {
      setUseSystemPrompt(value);
      saveContextSettings(value, contextContent);
    },
    [contextContent, saveContextSettings]
  );

  const updateContextContent = useCallback(
    (content: string) => {
      setContextContent(content);
      saveContextSettings(useSystemPrompt, content);
    },
    [useSystemPrompt, saveContextSettings]
  );

  // AI Processing function
  const processWithAI = useCallback(
    async (transcription: string, prompt: string) => {
      // Cancel any existing AI request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsAIProcessing(true);
        setLastAIResponse("");
        setError("");

        // Prepare message history for the AI
        const messageHistory = conversation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        let fullResponse = "";

        const usePluelyAPI = await shouldUsePluelyAPI();
        // Check if AI provider is configured
        if (!selectedAIProvider.provider && !usePluelyAPI) {
          setError("No AI provider selected. Please select one in settings.");
          return;
        }

        const provider = allAiProviders.find(
          (p) => p.id === selectedAIProvider.provider
        );
        if (!provider && !usePluelyAPI) {
          setError(
            "AI provider configuration not found. Please check your settings."
          );
          return;
        }

        // Use the fetchAIResponse function
        for await (const chunk of fetchAIResponse({
          provider: usePluelyAPI ? undefined : provider,
          selectedProvider: selectedAIProvider,
          systemPrompt: prompt,
          history: messageHistory,
          userMessage: transcription,
          imagesBase64: [],
        })) {
          fullResponse += chunk;
          setLastAIResponse((prev) => prev + chunk);
        }

        if (fullResponse) {
          // Save the conversation after successful completion
          setConversation((prev) => ({
            ...prev,
            messages: [
              {
                id: `msg_${Date.now()}_user`,
                role: "user" as const,
                content: transcription,
                timestamp: Date.now(),
              },
              {
                id: `msg_${Date.now()}_assistant`,
                role: "assistant" as const,
                content: fullResponse,
                timestamp: Date.now(),
              },
              ...prev.messages,
            ],
            updatedAt: Date.now(),
            title: prev.title || generateConversationTitle(transcription),
          }));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get AI response"
        );
      } finally {
        setIsAIProcessing(false);
      }
    },
    [selectedAIProvider, allAiProviders, conversation.messages]
  );

  const startCapture = useCallback(async () => {
    try {
      setError("");
      setSetupRequired(false);

      const usePluelyAPI = await shouldUsePluelyAPI();
      // Check if we have a configured speech provider
      if (!selectedSttProvider.provider && !usePluelyAPI) {
        setError("No AI provider selected. Please select one in settings.");
        return;
      }

      const providerConfig = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );

      if (!providerConfig && !usePluelyAPI) {
        setError(
          "AI provider configuration not found. Please check your settings."
        );
        return;
      }

      // Stop any existing capture first
      try {
        await invoke<string>("stop_system_audio_capture");
      } catch (stopErr) {
        // Ignore errors if nothing was running
      }

      await invoke<string>("start_system_audio_capture");
      setCapturing(true);

      // Always generate a new conversation ID when starting capture
      const conversationId = `sysaudio_conv_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      setConversation({
        id: conversationId,
        title: "",
        messages: [],
        createdAt: 0,
        updatedAt: 0,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to start system audio capture";

      // Check if this is a setup requirement error
      if (errorMessage.includes("SETUP_REQUIRED")) {
        setSetupRequired(true);
        setError(""); // Clear error since we'll show setup instructions instead
      } else {
        // Other errors (permissions, device issues, etc.)
        setSetupRequired(false);
        setError(errorMessage);
      }
    }
  }, []);

  const stopCapture = useCallback(async () => {
    try {
      // Cancel any ongoing AI request first
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Set capturing to false first to stop any ongoing processing
      setCapturing(false);
      setIsProcessing(false);
      setIsAIProcessing(false);

      // Then stop the Rust backend
      await invoke<string>("stop_system_audio_capture");

      // Clear all state
      setLastTranscription("");
      setLastAIResponse("");
      setSetupRequired(false);
      setError("");

      // reload the window to clear the audio visualizer
      window.location.reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to stop audio capture"
      );
    }
  }, []);

  const getAudioDevices = useCallback(async () => {
    try {
      const devices = await invoke<string[]>("get_audio_devices");
      return devices;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to get audio devices"
      );
      return [];
    }
  }, []);

  // Settings update function
  const updateSetting = useCallback(
    async <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
      try {
        // Update local state immediately
        setSettings((prev) => ({ ...prev, [key]: value }));

        // Update backend
        switch (key) {
          case "vadSensitivity":
            await invoke<string>("set_vad_sensitivity", {
              value: value as number,
            });
            break;
          case "speechThreshold":
            await invoke<string>("set_speech_threshold", {
              value: value as number,
            });
            break;
          case "silenceThreshold":
            await invoke<string>("set_silence_threshold", {
              chunks: value as number,
            });
            break;
          case "minSpeechDuration":
            await invoke<string>("set_min_speech_duration", {
              chunks: value as number,
            });
            break;
          case "preSpeechBufferSize":
            await invoke<string>("set_pre_speech_buffer_size", {
              chunks: value as number,
            });
            break;
        }
      } catch (err) {
        // Revert local state on error
        setSettings((prev) => ({ ...prev, [key]: prev[key] }));
        setError(
          err instanceof Error ? err.message : `Failed to update ${key}`
        );
      }
    },
    []
  );

  const debugAudioDevices = useCallback(async () => {
    try {
      const debugInfo = await invoke<string>("debug_audio_devices");

      return debugInfo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get debug info");
      return "";
    }
  }, []);

  const testAudioLevels = useCallback(async () => {
    try {
      const testResults = await invoke<string>("test_audio_levels");
      return testResults;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to test audio levels"
      );
      return "";
    }
  }, []);

  const resetSettings = useCallback(async () => {
    try {
      await invoke<string>("reset_audio_settings");
      setSettings(DEFAULT_SETTINGS);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset audio settings"
      );
    }
  }, []);

  // Debug functions
  const handleDebugDevices = useCallback(async () => {
    try {
      const info = await debugAudioDevices();
      setDebugInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to debug devices");
    }
  }, [debugAudioDevices]);

  const handleTestAudioLevels = useCallback(async () => {
    try {
      const results = await testAudioLevels();
      setTestResults(results);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to test audio levels"
      );
    }
  }, [testAudioLevels]);

  useEffect(() => {
    const shouldOpenPopover =
      capturing ||
      setupRequired ||
      isAIProcessing ||
      !!lastAIResponse ||
      !!error;
    setIsPopoverOpen(shouldOpenPopover);
    // Resize window when capturing state changes, setup is required, or there's an error
    resizeWindow(shouldOpenPopover);
  }, [
    capturing,
    setupRequired,
    isAIProcessing,
    lastAIResponse,
    error,
    resizeWindow,
  ]);

  // Register system audio callback for global shortcut
  useEffect(() => {
    globalShortcuts.registerSystemAudioCallback(async () => {
      if (capturing) {
        await stopCapture();
      } else {
        await startCapture();
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any ongoing AI request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Always try to stop capture during cleanup
      invoke<string>("stop_system_audio_capture").catch(() => {
        // Ignore errors during cleanup
      });
    };
  }, []);

  useEffect(() => {
    saveConversation(conversation);
  }, [conversation.messages.length, conversation.title, conversation.id]);

  const startNewConversation = useCallback(() => {
    setConversation({
      id: `sysaudio_conv_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      title: "",
      messages: [],
      createdAt: 0,
      updatedAt: 0,
    });
    setLastTranscription("");
    setLastAIResponse("");
    setError("");
    setSetupRequired(false);
    setIsProcessing(false);
    setIsAIProcessing(false);
    setIsPopoverOpen(false);
    setShowSettings(false);
    setSettings(DEFAULT_SETTINGS);
    setDebugInfo("");
    setTestResults("");
    setUseSystemPrompt(true);
  }, []);

  return {
    capturing,
    isProcessing,
    isAIProcessing,
    lastTranscription,
    lastAIResponse,
    error,
    setupRequired,
    startCapture,
    stopCapture,
    getAudioDevices,
    // Settings
    settings,
    showSettings,
    setShowSettings,
    updateSetting,
    resetSettings,
    // Debug
    debugInfo,
    testResults,
    handleDebugDevices,
    handleTestAudioLevels,
    debugAudioDevices,
    testAudioLevels,
    isPopoverOpen,
    setIsPopoverOpen,
    // Conversation management
    conversation,
    setConversation,
    // AI processing
    processWithAI,
    // Context management
    useSystemPrompt,
    setUseSystemPrompt: updateUseSystemPrompt,
    contextContent,
    setContextContent: updateContextContent,
    startNewConversation,
  };
}
