import { AudioSettings } from "@/hooks/useSystemAudio";
import { Button, Card } from "../ui";
import { SettingsIcon } from "lucide-react";
import { Header } from "../Header";

type Props = {
  capturing: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  resetSettings: () => void;
  settings: AudioSettings;
  updateSetting: (
    key: keyof AudioSettings,
    value: AudioSettings[keyof AudioSettings]
  ) => void;
};

export const Settings = ({
  capturing,
  showSettings,
  setShowSettings,
  resetSettings,
  settings,
  updateSetting,
}: Props) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-xs">Audio Settings and Status</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure voice detection and processing parameters and view current
            status
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowSettings(!showSettings)}
          className="h-8 w-8 p-0"
        >
          <SettingsIcon className="w-4 h-4" />
        </Button>
      </div>

      {showSettings && (
        <Card className="p-3 bg-muted/30 pb-6">
          {/* Status Information */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-xs">Status</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current capture and processing information
              </p>
            </div>
            <Card className="p-3 bg-muted/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {capturing
                  ? "Actively monitoring system audio for speech. Detected speech will be automatically transcribed and sent to your AI assistant."
                  : "Audio capture is stopped. Click the headphone button to start monitoring system audio."}
              </p>
            </Card>
          </div>

          <div className="flex justify-between">
            <Header
              title="Audio Settings"
              description="Configure voice detection and processing parameters"
            />
            {/* Reset Button */}
            <div className="flex ">
              <Button
                size="sm"
                variant="outline"
                onClick={resetSettings}
                className="text-xs h-7"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>

          {/* VAD Sensitivity */}
          <div className="space-y-2">
            <Header
              title={`VAD Sensitivity: ${settings.vadSensitivity.toFixed(3)}`}
              description="Controls how sensitive the voice activity detection is. Higher values detect quieter sounds."
            />

            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={settings.vadSensitivity}
                onChange={(e) =>
                  updateSetting("vadSensitivity", parseFloat(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Less sensitive</span>
                <span>More sensitive</span>
              </div>
            </div>
          </div>

          {/* Speech Threshold */}
          <div className="space-y-2">
            <Header
              title={`Speech Threshold: ${settings.speechThreshold.toFixed(3)}`}
              description="Minimum audio level to trigger speech detection. Lower values are more sensitive to quiet speech."
            />
            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="0.001"
                max="0.1"
                step="0.001"
                value={settings.speechThreshold}
                onChange={(e) =>
                  updateSetting("speechThreshold", parseFloat(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quiet</span>
                <span>Loud</span>
              </div>
            </div>
          </div>

          {/* Silence Threshold */}
          <div className="space-y-2">
            <Header
              title={`Silence Threshold: ${settings.silenceThreshold} frames`}
              description="Number of silent frames before stopping transcription. Higher values prevent cutting off pauses in speech."
            />
            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={settings.silenceThreshold}
                onChange={(e) =>
                  updateSetting("silenceThreshold", parseInt(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quick cutoff</span>
                <span>Long pauses</span>
              </div>
            </div>
          </div>

          {/* Minimum Speech Duration */}
          <div className="space-y-2">
            <Header
              title={`Min Speech Duration: ${settings.minSpeechDuration} frames`}
              description="Minimum length of speech to process. Filters out very short sounds and noise."
            />
            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="3"
                max="50"
                step="1"
                value={settings.minSpeechDuration}
                onChange={(e) =>
                  updateSetting("minSpeechDuration", parseInt(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Short sounds</span>
                <span>Long words</span>
              </div>
            </div>
          </div>

          {/* Pre-Speech Buffer Size */}
          <div className="space-y-2">
            <Header
              title={`Pre-Speech Buffer Size: ${settings.preSpeechBufferSize} frames`}
              description="Audio captured before speech detection to avoid missing the beginning of words."
            />

            <div className="flex flex-col gap-1">
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={settings.preSpeechBufferSize}
                onChange={(e) =>
                  updateSetting("preSpeechBufferSize", parseInt(e.target.value))
                }
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Less buffer</span>
                <span>More buffer</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
