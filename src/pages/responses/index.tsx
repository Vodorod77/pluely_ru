import {
  ResponseLength,
  LanguageSelector,
  AutoScrollToggle,
} from "./components";
import { PageLayout } from "@/layouts";
import { useApp, useTranslation } from "@/contexts";

const Responses = () => {
  const { hasActiveLicense } = useApp();
  const { t } = useTranslation();

  return (
    <PageLayout
      title={t("responses.title")}
      description={t("responses.description")}
    >
      {!hasActiveLicense && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-[10px] lg:text-sm text-foreground font-medium mb-2">
            🔒 {t("responses.premium_features")}
          </p>
          <p className="text-[10px] lg:text-sm text-muted-foreground">
            {t("responses.premium_description")}
          </p>
        </div>
      )}

      {/* Response Length */}
      <ResponseLength />

      {/* Language Selector */}
      <LanguageSelector />

      {/* Auto-Scroll Toggle */}
      <AutoScrollToggle />
    </PageLayout>
  );
};

export default Responses;
