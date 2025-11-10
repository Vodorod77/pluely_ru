import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { useApp } from "@/contexts";

interface ChatAudioProps {
  micOpen: boolean;
  setMicOpen: (open: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
}

export const ChatAudio = ({
  micOpen,
  setMicOpen,
  isRecording,
  setIsRecording,
}: ChatAudioProps) => {
  const { selectedSttProvider, pluelyApiEnabled } = useApp();
  const isProviderConfigured = pluelyApiEnabled || selectedSttProvider.provider;

  const handleMicClick = () => {
    if (!isProviderConfigured) {
      setMicOpen(!micOpen);
      return;
    }

    setIsRecording(!isRecording);
  };

  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          onClick={handleMicClick}
          className="h-9 w-9"
          title={isRecording ? "Recording..." : "Voice input"}
        >
          <MicIcon
            className={`h-4 w-4 ${
              isRecording ? "text-red-500 animate-pulse" : ""
            }`}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        className={`w-80 p-3 ${isProviderConfigured ? "hidden" : ""}`}
        sideOffset={8}
      >
        <div className="text-sm">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Required
          </div>
          <p className="text-muted-foreground">
            <div className="mt-2 flex items-center gap-1 text-orange-600">
              <InfoIcon size={16} />
              <span>Provider not configured</span>
            </div>
            <span className="block mt-2">
              Configure a speech provider in settings to enable voice input.
            </span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
