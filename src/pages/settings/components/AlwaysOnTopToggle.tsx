import { Switch, Label, Header } from "@/components";
import { useApp, useTranslation } from "@/contexts";

interface AlwaysOnTopToggleProps {
  className?: string;
}

export const AlwaysOnTopToggle = ({ className }: AlwaysOnTopToggleProps) => {
  const { customizable, toggleAlwaysOnTop } = useApp();
  const { t } = useTranslation();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAlwaysOnTop(checked);
  };

  return (
    <div id="always-on-top" className={`space-y-2 ${className}`}>
      <Header
        title={t("settings.always_on_top.title")}
        description={t("settings.always_on_top.description")}
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {customizable.alwaysOnTop.isEnabled
                ? "Disable Always On Top"
                : "Enable Always On Top"}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {customizable.alwaysOnTop.isEnabled
                ? "Window stays above all other applications (default)"
                : "Window behaves like normal applications"}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.alwaysOnTop.isEnabled}
          onCheckedChange={handleSwitchChange}
          title={`Toggle to ${
            !customizable.alwaysOnTop.isEnabled ? "Enabled" : "Disabled"
          } always on top`}
          aria-label={`Toggle to ${
            customizable.alwaysOnTop.isEnabled ? "Enabled" : "Disabled"
          } always on top`}
        />
      </div>
    </div>
  );
};
