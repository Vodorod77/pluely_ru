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
import { Context } from "./Context";
import { useSystemAudioType } from "@/hooks";

export const SystemAudio = ({
  capturing,
  isProcessing,
  isAIProcessing,
  lastTranscription,
  lastAIResponse,
  error,
  setupRequired,
  startCapture,
  stopCapture,
  isPopoverOpen,
  setIsPopoverOpen,
  useSystemPrompt,
  setUseSystemPrompt,
  contextContent,
  setContextContent,
  startNewConversation,
  conversation,
  resizeWindow,
  handleSetup,
  quickActions,
  addQuickAction,
  removeQuickAction,
  isManagingQuickActions,
  setIsManagingQuickActions,
  showQuickActions,
  setShowQuickActions,
  handleQuickActionClick,
}: useSystemAudioType) => {
  const platform = navigator.platform.toLowerCase();
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

      {capturing || setupRequired || error ? (
        <PopoverContent
          align="end"
          side="bottom"
          className="select-none w-screen p-0 border overflow-hidden border-input/50"
          sideOffset={8}
        >
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div
              className={`p-6 ${
                !lastTranscription && !lastAIResponse
                  ? "space-y-6"
                  : "space-y-4"
              }`}
            >
              {/* Header - Hide when there are messages to save space */}
              {!lastTranscription && !lastAIResponse && (
                <Header
                  setupRequired={setupRequired}
                  setIsPopoverOpen={setIsPopoverOpen}
                  resizeWindow={resizeWindow}
                  capturing={capturing}
                />
              )}

              {/* Error Display - Show simple error messages for non-setup issues */}
              {error && !setupRequired && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertCircleIcon className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                    <div className="space-y-2 w-full">
                      <div>
                        <h3 className="font-semibold text-xs mb-1 text-red-700">
                          Audio Capture Error
                        </h3>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {setupRequired ? (
                // Setup Instructions Section
                <SetupInstructions
                  setupRequired={setupRequired}
                  handleSetup={handleSetup}
                />
              ) : (
                <>
                  {/* Operation Section */}
                  <OperationSection
                    lastTranscription={lastTranscription}
                    lastAIResponse={lastAIResponse}
                    isAIProcessing={isAIProcessing}
                    conversation={conversation}
                    startNewConversation={startNewConversation}
                    quickActions={quickActions}
                    addQuickAction={addQuickAction}
                    removeQuickAction={removeQuickAction}
                    isManagingQuickActions={isManagingQuickActions}
                    setIsManagingQuickActions={setIsManagingQuickActions}
                    showQuickActions={showQuickActions}
                    setShowQuickActions={setShowQuickActions}
                    handleQuickActionClick={handleQuickActionClick}
                  />
                  {/* Context Settings */}
                  <Context
                    useSystemPrompt={useSystemPrompt}
                    setUseSystemPrompt={setUseSystemPrompt}
                    contextContent={contextContent}
                    setContextContent={setContextContent}
                  />
                </>
              )}
              {!setupRequired && platform.includes("mac") && (
                <SetupInstructions
                  setupRequired={setupRequired}
                  handleSetup={handleSetup}
                />
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
