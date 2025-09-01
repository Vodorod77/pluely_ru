import { Card } from "../ui";
import { BotIcon } from "lucide-react";

type Props = {
  lastTranscription: string;
  lastAIResponse: string;
  isAIProcessing: boolean;
};

export const OperationSection = ({
  lastTranscription,
  lastAIResponse,
  isAIProcessing,
}: Props) => {
  return (
    <div className="space-y-4">
      {/* AI Response */}
      {(lastAIResponse || isAIProcessing) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BotIcon className="w-3 h-3" />
            <h3 className="font-semibold text-xs">{`AI Assistant - answering to "${lastTranscription}"`}</h3>
          </div>
          <Card className="p-3 ">
            {isAIProcessing && !lastAIResponse ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" />
                <p className="text-xs italic">Getting information...</p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed whitespace-pre-wrap">
                {lastAIResponse}
                {isAIProcessing && (
                  <span className="inline-block w-2 h-4 animate-pulse ml-1" />
                )}
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
