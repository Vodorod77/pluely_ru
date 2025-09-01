import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";

interface Shortcuts {
  toggle: string;
  audio: string;
  screenshot: string;
  systemAudio: string;
}

// Global singleton to prevent multiple event listeners in StrictMode
let globalEventListeners: {
  focus?: UnlistenFn;
  audio?: UnlistenFn;
  screenshot?: UnlistenFn;
  systemAudio?: UnlistenFn;
} = {};

// Global debounce for screenshot events to prevent duplicates
let lastScreenshotEventTime = 0;

export const useGlobalShortcuts = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioCallbackRef = useRef<(() => void) | null>(null);
  const screenshotCallbackRef = useRef<(() => void) | null>(null);
  const systemAudioCallbackRef = useRef<(() => void) | null>(null);

  const checkShortcutsRegistered = useCallback(async (): Promise<boolean> => {
    try {
      const registered = await invoke<boolean>("check_shortcuts_registered");
      return registered;
    } catch (error) {
      console.error("Failed to check shortcuts:", error);
      return false;
    }
  }, []);

  const getShortcuts = useCallback(async (): Promise<Shortcuts | null> => {
    try {
      const shortcuts = await invoke<Shortcuts>("get_shortcuts");
      return shortcuts;
    } catch (error) {
      console.error("Failed to get shortcuts:", error);
      return null;
    }
  }, []);

  // Register input element for auto-focus
  const registerInputRef = useCallback((input: HTMLInputElement | null) => {
    inputRef.current = input;
  }, []);

  // Register audio callback
  const registerAudioCallback = useCallback((callback: () => void) => {
    audioCallbackRef.current = callback;
  }, []);

  // Register screenshot callback
  const registerScreenshotCallback = useCallback((callback: () => void) => {
    screenshotCallbackRef.current = callback;
  }, []);

  // Register system audio callback
  const registerSystemAudioCallback = useCallback((callback: () => void) => {
    systemAudioCallbackRef.current = callback;
  }, []);

  // Setup event listeners using global singleton
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        // Clean up any existing global listeners first
        if (globalEventListeners.focus) {
          try {
            globalEventListeners.focus();
          } catch (error) {
            console.warn("Error cleaning up focus listener:", error);
          }
        }
        if (globalEventListeners.audio) {
          try {
            globalEventListeners.audio();
          } catch (error) {
            console.warn("Error cleaning up audio listener:", error);
          }
        }
        if (globalEventListeners.screenshot) {
          try {
            globalEventListeners.screenshot();
          } catch (error) {
            console.warn("Error cleaning up screenshot listener:", error);
          }
        }
        if (globalEventListeners.systemAudio) {
          try {
            globalEventListeners.systemAudio();
          } catch (error) {
            console.warn("Error cleaning up system audio listener:", error);
          }
        }

        // Listen for focus text input event
        const unlistenFocus = await listen("focus-text-input", () => {
          // Add small delay to ensure window is fully shown
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        });
        globalEventListeners.focus = unlistenFocus;

        // Listen for audio recording event
        const unlistenAudio = await listen("start-audio-recording", () => {
          if (audioCallbackRef.current) {
            audioCallbackRef.current();
          }
        });
        globalEventListeners.audio = unlistenAudio;

        // Listen for screenshot trigger event with debouncing
        const unlistenScreenshot = await listen("trigger-screenshot", () => {
          const now = Date.now();
          const timeSinceLastEvent = now - lastScreenshotEventTime;

          // Debounce screenshot events (300ms minimum interval)
          if (timeSinceLastEvent < 300) {
            return;
          }

          lastScreenshotEventTime = now;

          if (screenshotCallbackRef.current) {
            screenshotCallbackRef.current();
          }
        });
        globalEventListeners.screenshot = unlistenScreenshot;

        // Listen for system audio toggle event
        const unlistenSystemAudio = await listen("toggle-system-audio", () => {
          if (systemAudioCallbackRef.current) {
            systemAudioCallbackRef.current();
          }
        });
        globalEventListeners.systemAudio = unlistenSystemAudio;
      } catch (error) {
        console.error("Failed to setup event listeners:", error);
      }
    };

    setupEventListeners();
  }, []);

  return {
    checkShortcutsRegistered,
    getShortcuts,
    registerInputRef,
    registerAudioCallback,
    registerScreenshotCallback,
    registerSystemAudioCallback,
  };
};
