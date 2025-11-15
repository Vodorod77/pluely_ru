import { ScreenshotConfigs } from "./components";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";
import { useTranslation } from "@/contexts";

const Settings = () => {
  const settings = useSettings();
  const { t } = useTranslation();
  return (
    <PageLayout
      title={t("screenshot.title")}
      description={t("screenshot.description")}
    >
      {/* Screenshot Configs */}
      <ScreenshotConfigs {...settings} />
    </PageLayout>
  );
};

export default Settings;
