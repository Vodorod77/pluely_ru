import { Button } from "../ui/button";
import { LaptopMinimalIcon, Loader2 } from "lucide-react";
import { UseCompletionReturn } from "@/types";
import { MAX_FILES } from "@/config";

export const Screenshot = ({
  screenshotConfiguration,
  attachedFiles,
  isLoading,
  captureScreenshot,
  isScreenshotLoading,
}: UseCompletionReturn) => {
  return (
    <div className="relative">
      <Button
        size="icon"
        className="cursor-pointer"
        title={
          screenshotConfiguration.enabled
            ? `Capture live screenshot (${screenshotConfiguration.mode} mode) ${attachedFiles.length}/${MAX_FILES}`
            : "Screenshots disabled in settings"
        }
        onClick={captureScreenshot}
        disabled={
          !screenshotConfiguration.enabled ||
          attachedFiles.length >= MAX_FILES ||
          isScreenshotLoading ||
          isLoading
        }
      >
        {isScreenshotLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LaptopMinimalIcon className="h-4 w-4" />
        )}
      </Button>

      {/* Disabled state indicator */}
      {!screenshotConfiguration.enabled && (
        <div className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full h-5 w-5 flex border border-muted items-center justify-center text-xs font-medium">
          ✕
        </div>
      )}
    </div>
  );
};
