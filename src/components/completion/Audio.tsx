import { MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { AutoSpeechVAD } from "./AutoSpeechVad";
import { UseCompletionReturn } from "@/types";

export const Audio = ({
  micOpen,
  setMicOpen,
  isOpenAIKeyAvailable,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        {isOpenAIKeyAvailable() && enableVAD ? (
          <AutoSpeechVAD
            submit={submit}
            setState={setState}
            setEnableVAD={setEnableVAD}
          />
        ) : (
          <Button
            size="icon"
            onClick={() => {
              setEnableVAD(!enableVAD);
            }}
            className="cursor-pointer"
            title="Toggle voice input"
          >
            <MicIcon className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="center"
        className={`w-80 p-3 ${isOpenAIKeyAvailable() ? "hidden" : ""}`}
        sideOffset={8}
      >
        <div className="text-sm">
          <div className="font-semibold text-orange-600 mb-1">
            OpenAI Key Required
          </div>
          <p className="text-muted-foreground">
            Speech-to-text requires an OpenAI API key for Whisper. Please
            configure it in settings to enable voice input.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};
