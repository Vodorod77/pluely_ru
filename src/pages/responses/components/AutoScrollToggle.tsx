import { Switch, Label, Header } from "@/components";
import { useApp, useTranslation } from "@/contexts";
import { updateAutoScroll } from "@/lib/storage/response-settings.storage";
import { useState, useEffect } from "react";
import { getResponseSettings } from "@/lib";

export const AutoScrollToggle = () => {
  const { t } = useTranslation();
  const { hasActiveLicense } = useApp();
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  useEffect(() => {
    const settings = getResponseSettings();
    setAutoScroll(settings.autoScroll);
  }, []);

  const handleSwitchChange = (checked: boolean) => {
    if (!hasActiveLicense) {
      return;
    }
    setAutoScroll(checked);
    updateAutoScroll(checked);
  };

  return (
    <div className="space-y-4">
      <Header
        title={t("responses.auto_scroll.title")}
        description={t("responses.auto_scroll.description")}
        isMainTitle
      />

      <div className="flex items-center justify-between p-4 border rounded-xl">
        <div className="flex items-center space-x-3">
          <div>
            <Label className="text-sm font-medium">
              {autoScroll ? t("responses.auto_scroll.enabled") : t("responses.auto_scroll.disabled")}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              {autoScroll
                ? t("responses.auto_scroll.enabled_description")
                : t("responses.auto_scroll.disabled_description")}
            </p>
          </div>
        </div>
        <Switch
          checked={autoScroll}
          onCheckedChange={handleSwitchChange}
          disabled={!hasActiveLicense}
          title={`Toggle to ${!autoScroll ? "enable" : "disable"} auto-scroll`}
          aria-label={`Toggle to ${
            autoScroll ? "disable" : "enable"
          } auto-scroll`}
        />
      </div>
    </div>
  );
};
