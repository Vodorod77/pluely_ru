import { Header } from "@/components";
import { UseSettingsReturn } from "@/types";
import { Providers } from "./Providers";
import { CustomProviders } from "./CustomProvider";
import { useTranslation } from "@/contexts";

export const AIProviders = (settings: UseSettingsReturn) => {
  const { t } = useTranslation();
  
  return (
    <div id="ai-providers" className="space-y-3">
      <Header
        title={t("dev_space.ai_providers.title")}
        description={t("dev_space.ai_providers.description")}
        isMainTitle
      />

      {/* Custom Provider */}
      <CustomProviders {...settings} />
      {/* Providers Selection */}
      <Providers {...settings} />
    </div>
  );
};
