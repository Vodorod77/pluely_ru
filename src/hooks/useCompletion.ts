import { useState, useCallback, useRef, useEffect } from "react";
import {
  getSettings,
  fileToBase64,
  formatMessageForProvider,
  streamCompletion,
  saveConversation,
  getConversation,
  generateConversationTitle,
  getProviderById,
  loadScreenshotConfig,
} from "@/lib";
import {
  AttachedFile,
  CompletionState,
  ChatMessage,
  ChatConversation,
  ScreenshotConfig,
} from "@/types";
import { useWindowResize } from "./useWindow";
import { useWindowFocus } from "@/hooks";

export const useCompletion = () => {
  const [state, setState] = useState<CompletionState>({
    input: "",
    response: "",
    isLoading: false,
    error: null,
    attachedFiles: [],
    currentConversationId: null,
    conversationHistory: [],
  });
  const [micOpen, setMicOpen] = useState(false);
  const [enableVAD, setEnableVAD] = useState(false);
  const [messageHistoryOpen, setMessageHistoryOpen] = useState(false);
  const [isFilesPopoverOpen, setIsFilesPopoverOpen] = useState(false);

  const { resizeWindow } = useWindowResize();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [screenshotConfig, setScreenshotConfig] = useState<ScreenshotConfig>(
    loadScreenshotConfig()
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setResponse = useCallback((value: string) => {
    setState((prev) => ({ ...prev, response: value }));
  }, []);

  const addFile = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
      };

      setState((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, attachedFile],
      }));
    } catch (error) {
      console.error("Failed to process file:", error);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, attachedFiles: [] }));
  }, []);

  const submit = useCallback(
    async (speechText?: string) => {
      const input = speechText || state.input;
      const settings = getSettings();
      if (
        !settings?.selectedProvider ||
        !settings?.apiKey ||
        !settings?.isApiKeySubmitted
      ) {
        setState((prev) => ({
          ...prev,
          error: "Please configure your AI provider and API key in settings",
        }));
        return;
      }

      const provider = getProviderById(settings.selectedProvider);
      if (!provider) {
        setState((prev) => ({
          ...prev,
          error: "Invalid provider selected",
        }));
        return;
      }

      const model =
        settings.selectedModel || settings.customModel || provider.defaultModel;
      if (!model) {
        setState((prev) => ({
          ...prev,
          error: "Please select a model in settings",
        }));
        return;
      }

      if (!input.trim()) {
        return;
      }

      if (speechText) {
        setState((prev) => ({
          ...prev,
          input: speechText,
        }));
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: "",
      }));

      try {
        const payload = formatMessageForProvider(
          provider,
          input,
          state.attachedFiles,
          settings.systemPrompt,
          state.conversationHistory
        );

        let fullResponse = "";

        await streamCompletion(
          provider,
          model,
          settings.apiKey,
          payload,
          (chunk) => {
            fullResponse += chunk;
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
            }));
          },
          (error) => {
            setState((prev) => ({
              ...prev,
              error,
              isLoading: false,
            }));
          },
          abortControllerRef.current
        );

        setState((prev) => ({ ...prev, isLoading: false }));

        // Save the conversation after successful completion
        if (fullResponse) {
          saveCurrentConversation(input, fullResponse, state.attachedFiles);
          // Clear input and attached files after saving
          setState((prev) => ({
            ...prev,
            input: "",
            attachedFiles: [],
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        }));
      }
    },
    [state.input, state.attachedFiles, state.isLoading]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    cancel();
    setState((prev) => ({
      ...prev,
      input: "",
      response: "",
      error: null,
      attachedFiles: [],
    }));
  }, [cancel]);

  const isOpenAIKeyAvailable = useCallback(() => {
    const settings = getSettings();
    if (!settings) return false;
    return (
      settings.openAiApiKey ||
      (settings.selectedProvider === "openai" && settings.apiKey)
    );
  }, []);

  const loadConversation = useCallback((conversation: ChatConversation) => {
    setState((prev) => ({
      ...prev,
      currentConversationId: conversation.id,
      conversationHistory: conversation.messages,
      input: "",
      response: "",
      error: null,
      isLoading: false,
    }));
  }, []);

  const startNewConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversationId: null,
      conversationHistory: [],
      input: "",
      response: "",
      error: null,
      isLoading: false,
      attachedFiles: [],
    }));
  }, []);

  const saveCurrentConversation = useCallback(
    (
      userMessage: string,
      assistantResponse: string,
      _attachedFiles: AttachedFile[] // Prefixed with _ to indicate intentionally unused
    ) => {
      const conversationId =
        state.currentConversationId ||
        `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      const userMsg: ChatMessage = {
        id: `msg_${timestamp}_user`,
        role: "user",
        content: userMessage,
        timestamp,
        // Don't store attachedFiles to avoid localStorage bloat
      };

      const assistantMsg: ChatMessage = {
        id: `msg_${timestamp}_assistant`,
        role: "assistant",
        content: assistantResponse,
        timestamp: timestamp + 1,
      };

      const newMessages = [...state.conversationHistory, userMsg, assistantMsg];
      const title =
        state.conversationHistory.length === 0
          ? generateConversationTitle(userMessage)
          : undefined;

      const conversation: ChatConversation = {
        id: conversationId,
        title:
          title ||
          (state.currentConversationId
            ? getConversation(state.currentConversationId)?.title ||
              generateConversationTitle(userMessage)
            : generateConversationTitle(userMessage)),
        messages: newMessages,
        createdAt: state.currentConversationId
          ? getConversation(state.currentConversationId)?.createdAt || timestamp
          : timestamp,
        updatedAt: timestamp,
      };

      saveConversation(conversation);

      setState((prev) => ({
        ...prev,
        currentConversationId: conversationId,
        conversationHistory: newMessages,
      }));
    },
    [state.currentConversationId, state.conversationHistory]
  );

  // Listen for conversation events from the main ChatHistory component
  useEffect(() => {
    const handleConversationSelected = (event: any) => {
      const conversation = event.detail;
      loadConversation(conversation);
    };

    const handleNewConversation = () => {
      startNewConversation();
    };

    const handleConversationDeleted = (event: any) => {
      const deletedId = event.detail;
      // If the currently active conversation was deleted, start a new one
      if (state.currentConversationId === deletedId) {
        startNewConversation();
      }
    };
    const handleScreenshotConfigChange = () => {
      const newConfig = loadScreenshotConfig();
      setScreenshotConfig(newConfig);
    };

    window.addEventListener("conversationSelected", handleConversationSelected);
    window.addEventListener("newConversation", handleNewConversation);
    window.addEventListener("conversationDeleted", handleConversationDeleted);
    window.addEventListener(
      "screenshotConfigChanged",
      handleScreenshotConfigChange
    );

    return () => {
      window.removeEventListener(
        "conversationSelected",
        handleConversationSelected
      );
      window.removeEventListener("newConversation", handleNewConversation);
      window.removeEventListener(
        "conversationDeleted",
        handleConversationDeleted
      );
      window.removeEventListener(
        "screenshotConfigChanged",
        handleScreenshotConfigChange
      );
    };
  }, [loadConversation, startNewConversation, state.currentConversationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILES = 6;

    files.forEach((file) => {
      if (
        file.type.startsWith("image/") &&
        state.attachedFiles.length < MAX_FILES
      ) {
        addFile(file);
      }
    });

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleScreenshotSubmit = async (base64: string, prompt?: string) => {
    try {
      if (prompt) {
        // Auto mode: Submit directly to AI with screenshot, bypassing attached files
        const response = await fetch(`data:image/png;base64,${base64}`);
        const blob = await response.blob();
        const file = new File([blob], `screenshot_${Date.now()}.png`, {
          type: "image/png",
        });

        const base64Data = await fileToBase64(file);
        const attachedFile: AttachedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type,
          base64: base64Data,
          size: file.size,
        };

        // Temporarily set the screenshot for the API call without adding to state
        const tempAttachedFiles = [attachedFile];

        // Submit directly with the screenshot
        const settings = getSettings();
        if (
          !settings?.selectedProvider ||
          !settings?.apiKey ||
          !settings?.isApiKeySubmitted
        ) {
          setState((prev) => ({
            ...prev,
            error: "Please configure your AI provider and API key in settings",
          }));
          return;
        }

        const provider = getProviderById(settings.selectedProvider);
        if (!provider) {
          setState((prev) => ({ ...prev, error: "Invalid provider selected" }));
          return;
        }

        const model =
          settings.selectedModel ||
          settings.customModel ||
          provider.defaultModel;
        if (!model) {
          setState((prev) => ({
            ...prev,
            error: "Please select a model in settings",
          }));
          return;
        }

        // Cancel any existing request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        setState((prev) => ({
          ...prev,
          input: prompt,
          isLoading: true,
          error: null,
          response: "",
        }));

        const payload = formatMessageForProvider(
          provider,
          prompt,
          tempAttachedFiles,
          settings.systemPrompt,
          state.conversationHistory
        );

        let fullResponse = "";

        await streamCompletion(
          provider,
          model,
          settings.apiKey,
          payload,
          (chunk) => {
            fullResponse += chunk;
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
            }));
          },
          (error) => {
            setState((prev) => ({
              ...prev,
              error,
              isLoading: false,
            }));
          },
          abortControllerRef.current
        );

        setState((prev) => ({ ...prev, isLoading: false }));

        // Save the conversation after successful completion
        if (fullResponse) {
          saveCurrentConversation(prompt, fullResponse, tempAttachedFiles);
          // Clear input after saving
          setState((prev) => ({
            ...prev,
            input: "",
          }));
        }
      } else {
        // Manual mode: Add to attached files
        const response = await fetch(`data:image/png;base64,${base64}`);
        const blob = await response.blob();
        const file = new File([blob], `screenshot_${Date.now()}.png`, {
          type: "image/png",
        });

        await addFile(file);
      }
    } catch (error) {
      console.error("Failed to process screenshot:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred processing screenshot",
        isLoading: false,
      }));
    }
  };

  const onRemoveAllFiles = () => {
    clearFiles();
    setIsFilesPopoverOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!state.isLoading && state.input.trim()) {
        submit();
      }
    }
  };

  const isPopoverOpen =
    state.isLoading || state.response !== "" || state.error !== null;

  useEffect(() => {
    resizeWindow(
      isPopoverOpen || micOpen || messageHistoryOpen || isFilesPopoverOpen
    );
  }, [
    isPopoverOpen,
    micOpen,
    messageHistoryOpen,
    resizeWindow,
    isFilesPopoverOpen,
  ]);

  // Auto scroll to bottom when response updates
  useEffect(() => {
    if (state.response && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [state.response]);

  useWindowFocus({
    onFocusLost: () => {
      setMicOpen(false);
      setMessageHistoryOpen(false);
    },
  });

  return {
    input: state.input,
    setInput,
    response: state.response,
    setResponse,
    isLoading: state.isLoading,
    error: state.error,
    attachedFiles: state.attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
    isOpenAIKeyAvailable,
    setState,
    enableVAD,
    setEnableVAD,
    micOpen,
    setMicOpen,
    currentConversationId: state.currentConversationId,
    conversationHistory: state.conversationHistory,
    loadConversation,
    startNewConversation,
    messageHistoryOpen,
    setMessageHistoryOpen,
    screenshotConfig,
    setScreenshotConfig,
    handleScreenshotSubmit,
    handleFileSelect,
    handleKeyPress,
    isPopoverOpen,
    scrollAreaRef,
    resizeWindow,
    isFilesPopoverOpen,
    setIsFilesPopoverOpen,
    onRemoveAllFiles,
  };
};
