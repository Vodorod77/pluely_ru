import { AIProviders, STTProviders } from "./components";
import Contribute from "@/components/Contribute";
import { useSettings } from "@/hooks";
import { PageLayout } from "@/layouts";
import { useTranslation } from "@/contexts";

const DevSpace = () => {
  const { t } = useTranslation();
  const settings = useSettings();

  return (
    <PageLayout title={t("dev_space.title")} description={t("dev_space.description")}>
      <Contribute />
      {/* Provider Selection */}
      <AIProviders {...settings} />

      {/* STT Providers */}
      <STTProviders {...settings} />
    </PageLayout>
  );
};

export default DevSpace;
