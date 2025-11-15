import { Switch, Label, Header } from "@/components";
import { useApp, useTranslation } from "@/contexts";

interface AppIconToggleProps {
  className?: string;
}

export const AppIconToggle = ({ className }: AppIconToggleProps) => {
  const { customizable, toggleAppIconVisibility } = useApp();
  const { t } = useTranslation();

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAppIconVisibility(checked);
  };

  return (
    <div id="app-icon" className={`space-y-2 ${className}`}>
      <Header
        title={t("settings.app_icon.title")}
        description={t("settings.app_icon.description")}
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {t("settings.app_icon.label")}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {!customizable.appIcon.isVisible 
                ? t("settings.app_icon.will_be_visible")
                : t("settings.app_icon.will_be_hidden")}
            </p>
          </div>
        </div>
        <Switch
          checked={customizable.appIcon.isVisible}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle app icon visibility"
        />
      </div>
    </div>
  );
};
