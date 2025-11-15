import { Switch, Label, Header } from "@/components";
import { useApp, useTranslation } from "@/contexts";

interface AutostartToggleProps {
  className?: string;
}

export const AutostartToggle = ({ className }: AutostartToggleProps) => {
  const { customizable, toggleAutostart } = useApp();
  const { t } = useTranslation();

  const isEnabled = customizable?.autostart?.isEnabled ?? true;

  const handleSwitchChange = async (checked: boolean) => {
    await toggleAutostart(checked);
  };

  return (
    <div id="autostart" className={`space-y-2 ${className}`}>
      <Header
        title={t("settings.autostart.title")}
        description={t("settings.autostart.description")}
        isMainTitle
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">{t("settings.autostart.label")}</Label>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled
                ? "Pluely will launch automatically on system startup"
                : "Pluely will not launch automatically"}
            </p>
          </div>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleSwitchChange}
          aria-label="Toggle autostart"
        />
      </div>
    </div>
  );
};
