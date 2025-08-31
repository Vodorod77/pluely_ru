import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  ScrollArea,
} from "@/components/ui";
import {
  HeadphonesIcon,
  AlertCircleIcon,
  LoaderIcon,
  AudioLinesIcon,
} from "lucide-react";
import { Warning } from "./Warning";
import { Header } from "./Header";
import { SetupInstructions } from "./SetupInstructions";
import { OperationSection } from "./OperationSection";
import { Settings } from "./Settings";
import { useSystemAudioType } from "@/hooks";

export const SystemAudio = ({
  capturing,
  isProcessing,
  lastTranscription,
  error,
  setupRequired,
  startCapture,
  startDefaultCapture,
  stopCapture,
  settings,
  showSettings,
  setShowSettings,
  updateSetting,
  resetSettings,
  debugInfo,
  testResults,
  handleDebugDevices,
  handleTestAudioLevels,
  isPopoverOpen,
  setIsPopoverOpen,
}: useSystemAudioType) => {
  const handleToggleCapture = async () => {
    if (capturing) {
      await stopCapture();
    } else {
      await startCapture();
    }
  };

  const getButtonIcon = () => {
    if (setupRequired) return <AlertCircleIcon className="text-orange-500" />;
    if (error && !setupRequired)
      return <AlertCircleIcon className="text-red-500" />;
    if (isProcessing) return <LoaderIcon className="animate-spin" />;
    if (capturing)
      return <AudioLinesIcon className="text-green-500 animate-pulse" />;
    return <HeadphonesIcon />;
  };

  const getButtonTitle = () => {
    if (setupRequired) return "Setup required - Click for instructions";
    if (error && !setupRequired) return `Error: ${error}`;
    if (isProcessing) return "Transcribing audio...";
    if (capturing) return "Stop system audio capture";
    return "Start system audio capture";
  };

  return (
    <Popover
      open={isPopoverOpen}
      onOpenChange={(open) => {
        // Don't allow closing the popover when capturing is active
        if (capturing && !open) {
          return;
        }
        setIsPopoverOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon"
          title={getButtonTitle()}
          onClick={handleToggleCapture}
          className={`${capturing ? "bg-green-50 hover:bg-green-100" : ""} ${
            error ? "bg-red-100 hover:bg-red-200" : ""
          }`}
        >
          {getButtonIcon()}
        </Button>
      </PopoverTrigger>

      {capturing || setupRequired ? (
        <PopoverContent
          className="w-screen p-0 border overflow-hidden border-input/50"
          side="top"
          align="center"
          sideOffset={8}
        >
          <ScrollArea className="h-[calc(100vh-7.2rem)]">
            <div className="p-6 space-y-6">
              {/* Header */}
              <Header
                setupRequired={setupRequired}
                error={error}
                isProcessing={isProcessing}
                capturing={capturing}
              />

              {setupRequired ? (
                // Setup Instructions Section
                <SetupInstructions
                  handleDebugDevices={handleDebugDevices}
                  handleTestAudioLevels={handleTestAudioLevels}
                  startDefaultCapture={startDefaultCapture}
                  startCapture={startCapture}
                  debugInfo={debugInfo}
                  testResults={testResults}
                />
              ) : (
                <>
                  {/* Operation Section */}
                  <OperationSection lastTranscription={lastTranscription} />
                  {/* Audio Settings */}
                  <Settings
                    capturing={capturing}
                    showSettings={showSettings}
                    setShowSettings={setShowSettings}
                    resetSettings={resetSettings}
                    settings={settings}
                    updateSetting={updateSetting}
                  />
                </>
              )}

              {/* Experimental Warning */}
              <Warning />
            </div>
          </ScrollArea>
        </PopoverContent>
      ) : null}
    </Popover>
  );
};
