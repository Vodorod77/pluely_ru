import {
  Theme,
  AlwaysOnTopToggle,
  AppIconToggle,
  AutostartToggle,
} from "./components";
import { PageLayout } from "@/layouts";
import { LanguageSelector } from "@/components";
import { useTranslation } from "@/contexts";

const Settings = () => {
  const { t } = useTranslation();
  
  return (
    <PageLayout title={t("settings.title")} description={t("settings.description")}>
      {/* Language Selector */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold text-sm">{t("settings.language.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("settings.language.description")}</p>
        </div>
        <LanguageSelector />
      </div>

      {/* Theme */}
      <Theme />

      {/* Autostart Toggle */}
      <AutostartToggle />

      {/* App Icon Toggle */}
      <AppIconToggle />

      {/* Always On Top Toggle */}
      <AlwaysOnTopToggle />
    </PageLayout>
  );
};

export default Settings;
