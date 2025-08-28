import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef } from "react";

interface Shortcuts {
  toggle: string;
  audio: string;
  screenshot: string;
}

export const useGlobalShortcuts = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const audioCallbackRef = useRef<(() => void) | null>(null);
  const screenshotCallbackRef = useRef<(() => void) | null>(null);

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

  // Setup event listeners
  useEffect(() => {
    const setupEventListeners = async () => {
      // Listen for focus text input event
      const unlistenFocus = await listen("focus-text-input", () => {
        // Add small delay to ensure window is fully shown
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      });

      // Listen for audio recording event
      const unlistenAudio = await listen("start-audio-recording", () => {
        if (audioCallbackRef.current) {
          audioCallbackRef.current();
        }
      });

      // Listen for screenshot trigger event
      const unlistenScreenshot = await listen("trigger-screenshot", () => {
        if (screenshotCallbackRef.current) {
          screenshotCallbackRef.current();
        }
      });

      // Cleanup function
      return () => {
        unlistenFocus();
        unlistenAudio();
        unlistenScreenshot();
      };
    };

    let cleanup: (() => void) | null = null;

    setupEventListeners()
      .then((cleanupFn) => {
        cleanup = cleanupFn;
      })
      .catch((error) => {
        console.error("Failed to setup event listeners:", error);
      });

    // Cleanup on unmount
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return {
    checkShortcutsRegistered,
    getShortcuts,
    registerInputRef,
    registerAudioCallback,
    registerScreenshotCallback,
  };
};
