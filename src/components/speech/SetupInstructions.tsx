import { AlertCircleIcon } from "lucide-react";
import { Button, Card } from "../ui";
import { getPlatformInstructions } from "@/lib";

type Props = {
  handleDebugDevices: () => void;
  handleTestAudioLevels: () => void;
  startDefaultCapture: () => void;
  startCapture: () => void;
  debugInfo: string;
  testResults: string;
};

export const SetupInstructions = ({
  handleDebugDevices,
  handleTestAudioLevels,
  startDefaultCapture,
  startCapture,
  debugInfo,
  testResults,
}: Props) => {
  // Detect platform
  const getPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("mac")) return "macos";
    if (userAgent.includes("win")) return "windows";
    if (userAgent.includes("linux")) return "linux";
    return "unknown";
  };

  const platform = getPlatform();

  const platformInstructions = getPlatformInstructions(platform);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <AlertCircleIcon className="w-5 h-5 text-orange-500 mt-1 flex-shrink-0" />
        <div className="space-y-3 w-full">
          <div>
            <h3 className="font-semibold text-xs mb-1">
              {platformInstructions.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {platformInstructions.note}
            </p>
          </div>

          <Card className="bg-muted/50 border p-3 w-full">
            <ol className="text-xs space-y-1.5">
              {platformInstructions.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="font-medium min-w-[24px] h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-xs">Quick Actions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Test your setup or try different capture methods
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Button size="sm" variant="outline" asChild className="h-10">
            <a
              href="https://github.com/iamsrikanthnani/open-cluely/blob/main/SYSTEM_AUDIO_SETUP.md"
              target="_blank"
              className="flex items-center gap-2"
            >
              📖 Setup Guide
            </a>
          </Button>
          <Button
            size="sm"
            onClick={handleDebugDevices}
            variant="outline"
            className="h-10 flex items-center gap-2"
          >
            🔍 Debug Devices
          </Button>
          <Button
            size="sm"
            onClick={handleTestAudioLevels}
            variant="outline"
            className="h-10 flex items-center gap-2"
          >
            🎵 Test Audio
          </Button>
          <Button
            size="sm"
            onClick={startDefaultCapture}
            variant="outline"
            className="h-10 flex items-center gap-2"
          >
            🎤 Use Microphone
          </Button>
        </div>
        <Button
          onClick={startCapture}
          className="w-full h-10 flex items-center gap-2"
        >
          � Try System Audio Anyway
        </Button>
      </div>

      {/* Debug Results */}
      {debugInfo && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-xs">Debug Information</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audio device detection results
            </p>
          </div>
          <Card className="p-3 bg-muted/30">
            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48 text-muted-foreground">
              {debugInfo}
            </pre>
          </Card>
        </div>
      )}

      {testResults && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-xs">Audio Test Results</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Audio level analysis and recommendations
            </p>
          </div>
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-48 text-blue-700">
              {testResults}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
};
