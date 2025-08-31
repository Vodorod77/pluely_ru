import { Card } from "../ui";

type Props = {
  lastTranscription: string;
};

export const OperationSection = ({ lastTranscription }: Props) => {
  return (
    <div className="space-y-6">
      {/* Last Transcription */}
      {lastTranscription && (
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-xs">Latest Transcription</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Most recent audio transcription result
            </p>
          </div>
          <Card className="p-3 bg-muted/30">
            <p className="text-xs leading-relaxed">{lastTranscription}</p>
          </Card>
        </div>
      )}
    </div>
  );
};
