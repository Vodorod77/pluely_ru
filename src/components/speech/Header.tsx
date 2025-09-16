import { InfoIcon, X } from "lucide-react";
import { Button } from "../ui";

type Props = {
  setupRequired: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resizeWindow: (expanded: boolean) => Promise<void>;
  capturing: boolean;
};

export const Header = ({
  setupRequired,
  setIsPopoverOpen,
  resizeWindow,
  capturing,
}: Props) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-b border-input/50 pb-3 flex justify-between items-start">
        <div>
          <h2 className="font-semibold text-sm">System Audio Capture</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {setupRequired
              ? "Setup required to capture system audio"
              : "Real-time AI assistant using system audio, until and unless sound is detected from your audio speakers no api calls will be made (expect responses in ~2-4 seconds)"}
          </p>
        </div>
        {!capturing ? (
          <div className="">
            <Button
              size="icon"
              title="Close Settings"
              onClick={() => {
                setIsPopoverOpen(false);
                resizeWindow(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-row items-center gap-2">
          <InfoIcon className="w-4 h-4" />
          <p className="text-sm text-muted-foreground">
            Pluely audio features are being actively developed and enhanced in
            future versions. also you can always change your Audio settings for
            better performance.
          </p>
        </div>
      </div>
    </div>
  );
};
