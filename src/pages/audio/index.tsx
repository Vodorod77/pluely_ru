import { AudioSelection } from "./components";
import { PageLayout } from "@/layouts";
import { useTranslation } from "@/contexts";

const Audio = () => {
  const { t } = useTranslation();
  return (
    <PageLayout
      title={t("audio.title")}
      description={t("audio.description")}
    >
      <AudioSelection />
    </PageLayout>
  );
};

export default Audio;
