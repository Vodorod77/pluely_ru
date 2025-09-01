import { Switch, Label, Header } from "@/components";
import { useApp } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { appIconState, toggleAppIconVisibility } = useApp();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAppIconVisibility(checked);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Header
        title="App Icon Stealth Mode"
        description="Control dock/taskbar icon visibility when window is hidden for maximum discretion"
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {appIconState.isVisible
                ? "Show Icon in Dock/Taskbar"
                : "Hide Icon from Dock/Taskbar"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {appIconState.isVisible
                ? "App icon stays visible when window is hidden (default)"
                : "App icon disappears completely for maximum stealth"}
            </p>
          </div>
        </div>
        <Switch
          checked={appIconState.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle app icon visibility"
        />
      </div>
    </div>
  );
};
