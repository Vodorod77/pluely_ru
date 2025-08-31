import { AlertCircleIcon, LoaderIcon } from "lucide-react";

type Props = {
  setupRequired: boolean;
  error: string;
  isProcessing: boolean;
  capturing: boolean;
};

export const Header = ({
  setupRequired,
  error,
  isProcessing,
  capturing,
}: Props) => {
  return (
    <div className="flex items-center justify-between border-b border-input/50 pb-3">
      <div className="flex-1">
        <h2 className="font-semibold text-sm">System Audio Capture</h2>
        <p className="text-xs text-muted-foreground mt-1">
          {setupRequired
            ? "Setup virtual audio device to capture system audio"
            : "Real-time AI assistant using system audio"}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4">
        {/* Single Status Display - Priority: Error > Transcribing > Listening > Inactive */}
        {error && !setupRequired ? (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircleIcon className="w-4 h-4" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : isProcessing ? (
          <div className="flex items-center gap-2 animate-pulse">
            <LoaderIcon className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Transcribing...</span>
          </div>
        ) : capturing ? (
          <div className="flex items-center gap-2 text-green-600 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">Listening...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-xs">Inactive</span>
          </div>
        )}
      </div>
    </div>
  );
};
