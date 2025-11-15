import { CursorSelection, ShortcutManager } from "./components";
import { PageLayout } from "@/layouts";
import { useTranslation } from "@/contexts";

const Shortcuts = () => {
  const { t } = useTranslation();
  return (
    <PageLayout
      title={t("shortcuts_page.title")}
      description={t("shortcuts_page.description")}
    >
      <div className="flex flex-col gap-6 pb-8">
        {/* Cursor Selection */}
        <CursorSelection />

        {/* Keyboard Shortcuts */}
        <ShortcutManager />
      </div>
    </PageLayout>
  );
};

export default Shortcuts;
