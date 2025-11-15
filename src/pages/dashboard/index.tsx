import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { GetLicense, LanguageSelector } from "@/components";
import { PluelyApiSetup, Usage } from "./components";
import { PageLayout } from "@/layouts";
import { useApp, useTranslation } from "@/contexts";

const Dashboard = () => {
  const { hasActiveLicense } = useApp();
  const { t } = useTranslation();
  const [activity, setActivity] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const fetchActivity = useCallback(async () => {
    if (!hasActiveLicense) {
      setActivity({ data: [], total_tokens_used: 0 });
      return;
    }
    setLoadingActivity(true);
    try {
      const response = await invoke("get_activity");
      const responseData: any = response;
      if (responseData && responseData.success) {
        setActivity(responseData);
      } else {
        setActivity({ data: [], total_tokens_used: 0 });
      }
    } catch (error) {
      setActivity({ data: [], total_tokens_used: 0 });
    } finally {
      setLoadingActivity(false);
    }
  }, [hasActiveLicense]);

  useEffect(() => {
    if (hasActiveLicense) {
      fetchActivity();
    } else {
      setActivity(null);
    }
  }, [fetchActivity, hasActiveLicense]);

  const activityData =
    activity && Array.isArray(activity.data) ? activity.data : [];
  const totalTokens =
    activity && typeof activity.total_tokens_used === "number"
      ? activity.total_tokens_used
      : 0;

  return (
    <PageLayout
      title={t("dashboard.title")}
      description={t("dashboard.description")}
      rightSlot={!hasActiveLicense ? <GetLicense /> : null}
    >
      {/* Language Selector */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div>
          <h3 className="font-semibold text-sm">{t("settings.language.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("settings.language.description")}</p>
        </div>
        <LanguageSelector />
      </div>

      {/* Pluely API Setup */}
      <PluelyApiSetup />

      <Usage
        loading={!hasActiveLicense || loadingActivity}
        onRefresh={fetchActivity}
        data={activityData}
        totalTokens={totalTokens}
      />
    </PageLayout>
  );
};

export default Dashboard;
