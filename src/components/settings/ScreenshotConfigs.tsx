import { useState, useEffect } from "react";
import { Label } from "@/components";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { loadScreenshotConfig, saveScreenshotConfig } from "@/lib";
import { ScreenshotConfig } from "@/types";

export const ScreenshotConfigs = ({}) => {
  const [config, setConfig] = useState<ScreenshotConfig>({
    mode: "manual",
    autoPrompt: "Analyze this screenshot and provide insights",
    enabled: true,
  });

  useEffect(() => {
    const savedConfig = loadScreenshotConfig();
    setConfig(savedConfig);
  }, []);

  const handleModeChange = (value: "auto" | "manual") => {
    const newConfig = { ...config, mode: value };
    setConfig(newConfig);
    saveScreenshotConfig(newConfig);
    // Dispatch custom event for immediate UI updates
    window.dispatchEvent(new CustomEvent("screenshotConfigChanged"));
  };

  const handlePromptChange = (value: string) => {
    const newConfig = { ...config, autoPrompt: value };
    setConfig(newConfig);
    saveScreenshotConfig(newConfig);
    // Dispatch custom event for immediate UI updates
    window.dispatchEvent(new CustomEvent("screenshotConfigChanged"));
  };

  const handleEnabledChange = (enabled: boolean) => {
    const newConfig = { ...config, enabled };
    setConfig(newConfig);
    saveScreenshotConfig(newConfig);
    // Dispatch custom event for immediate UI updates
    window.dispatchEvent(new CustomEvent("screenshotConfigChanged"));
  };

  return (
    <div className="space-y-3">
      <div className="border-b border-input/50 pb-2">
        <Label className="text-lg font-semibold">
          Screenshot Configuration
        </Label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Configure how screenshots are handled - automatically submit to AI or
          manual mode.
        </p>
      </div>

      <div className="space-y-3">
        {/* Enable/Disable Screenshot Feature */}
        <div className="flex items-center justify-between">
          <div className="">
            <Label className="text-sm font-medium">Enable Screenshots</Label>
            <p className="text-xs text-muted-foreground">
              Allow taking screenshots in the application
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Only show configuration options when screenshots are enabled */}
        {config.enabled && (
          <>
            {/* Mode Selection */}
            <div className="space-y-2">
              <div className="flex flex-col">
                <Label className="text-sm font-medium">Screenshot Mode</Label>
                {config.mode === "manual" ? (
                  <div className="text-xs text-muted-foreground">
                    Screenshots will be captured and automatically added to your
                    attached files. You can then submit them with your own
                    prompt.
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    Screenshots will be automatically submitted to AI using your
                    custom prompt. No manual intervention required.
                  </div>
                )}
              </div>
              <Select value={config.mode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">
                      {config.mode === "auto" ? "Auto" : "Manual"} Mode
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="font-medium">Manual Mode</div>
                  </SelectItem>
                  <SelectItem value="auto">
                    <div className="font-medium">Auto Mode</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Prompt Input - Only show when auto mode is selected */}
            {config.mode === "auto" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Auto Prompt</Label>
                <Input
                  placeholder="Enter prompt for automatic screenshot analysis..."
                  value={config.autoPrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used automatically when screenshots are
                  taken
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tips - only show when screenshots are enabled */}
      {config.enabled && (
        <div className="text-xs text-muted-foreground/70">
          <p>
            💡 <strong>Tip:</strong> Auto mode is great for quick analysis,
            manual mode gives you more control. Screenshots are limited to 1 at
            a time to maintain clarity
          </p>
        </div>
      )}
    </div>
  );
};
