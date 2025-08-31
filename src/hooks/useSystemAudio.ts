import { useEffect, useState, useCallback } from "react";
import { useWindowResize } from ".";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useApp } from "@/contexts";
import { fetchSTT } from "@/lib/functions";

// Audio settings type
export interface AudioSettings {
  vadSensitivity: number;
  speechThreshold: number;
  silenceThreshold: number;
  minSpeechDuration: number;
  preSpeechBufferSize: number;
}

// Default settings
const DEFAULT_SETTINGS: AudioSettings = {
  vadSensitivity: 0.004,
  speechThreshold: 0.01,
  silenceThreshold: 200,
  minSpeechDuration: 20,
  preSpeechBufferSize: 20,
};

export type useSystemAudioType = ReturnType<typeof useSystemAudio>;

export function useSystemAudio() {
  const { resizeWindow } = useWindowResize();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [testResults, setTestResults] = useState<string>("");
  const { selectedSttProvider, allSttProviders } = useApp();

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
          setError("");
        });

        // Listen for speech detected events (with audio data)
        speechDetectedUnlisten = await listen(
          "speech-detected",
          async (event) => {
            try {
              const base64Audio = event.payload as string;

              // Check if we have a configured speech provider
              if (!selectedSttProvider.provider) {
                setError(
                  "No speech provider selected. Please select one in settings."
                );
                return;
              }

              const providerConfig = allSttProviders.find(
                (p) => p.id === selectedSttProvider.provider
              );

              if (!providerConfig) {
                setError(
                  "Speech provider configuration not found. Please check your settings."
                );
                return;
              }

              // Convert base64 to blob
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const audioBlob = new Blob([bytes], { type: "audio/wav" });
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

  const startCapture = useCallback(async () => {
    try {
      setError("");
      setSetupRequired(false);

      // Stop any existing capture first
      try {
        await invoke<string>("stop_system_audio_capture");
      } catch (stopErr) {
        // Ignore errors if nothing was running
      }

      await invoke<string>("start_system_audio_capture");
      setCapturing(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to start audio capture";

      // Check if this is a setup-related error
      if (
        errorMessage.includes("No system audio loopback device found") ||
        errorMessage.includes("virtual audio device") ||
        errorMessage.includes("BlackHole") ||
        errorMessage.includes("Stereo Mix") ||
        errorMessage.includes("monitor device") ||
        errorMessage.includes("VB-Audio Virtual Cable") ||
        errorMessage.includes("Failed to start audio capture")
      ) {
        setSetupRequired(true);
        setError(errorMessage);
      } else {
        setError(errorMessage);
      }
    }
  }, []);

  const startDefaultCapture = useCallback(async () => {
    try {
      setError("");
      setSetupRequired(false);

      // Stop any existing capture first
      try {
        await invoke<string>("stop_system_audio_capture");
      } catch (stopErr) {
        // Ignore errors if nothing was running
      }

      await invoke<string>("start_default_audio_capture");
      setCapturing(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start audio capture"
      );
    }
  }, []);

  const stopCapture = useCallback(async () => {
    try {
      await invoke<string>("stop_system_audio_capture");
      setCapturing(false);
      setIsProcessing(false);
      setLastTranscription("");
      setSetupRequired(false);
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
            await invoke<string>("set_vad_sensitivity", { sensitivity: value });
            break;
          case "speechThreshold":
            await invoke<string>("set_speech_threshold", { threshold: value });
            break;
          case "silenceThreshold":
            await invoke<string>("set_silence_threshold", { threshold: value });
            break;
          case "minSpeechDuration":
            await invoke<string>("set_min_speech_duration", {
              duration: value,
            });
            break;
          case "preSpeechBufferSize":
            await invoke<string>("set_pre_speech_buffer_size", { size: value });
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
    const shouldOpenPopover = capturing || setupRequired;
    setIsPopoverOpen(shouldOpenPopover);
    // Resize window when capturing state changes or setup is required
    resizeWindow(shouldOpenPopover);
  }, [capturing, setupRequired, resizeWindow]);

  return {
    capturing,
    isProcessing,
    lastTranscription,
    error,
    setupRequired,
    startCapture,
    startDefaultCapture,
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
  };
}
