import { UseSettingsReturn } from "@/types";
import { Card, Button, Header } from "@/components";
import { EditIcon, TrashIcon } from "lucide-react";
import { CreateEditProvider } from "./CreateEditProvider";
import { useCustomSttProviders } from "@/hooks";
import curl2Json from "@bany/curl-to-json";
import { useTranslation } from "@/contexts";

export const CustomProviders = ({ allSttProviders }: UseSettingsReturn) => {
  const { t } = useTranslation();
  const customProviderHook = useCustomSttProviders();
  const {
    handleEdit,
    handleDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
  } = customProviderHook;

  return (
    <div className="space-y-2">
      <Header
        title={t("dev_space.stt_providers.custom")}
        description={t("dev_space.stt_providers.custom_description")}
      />

      <div className="space-y-2">
        {/* Existing Custom Providers */}
        {allSttProviders.filter((provider) => provider?.isCustom).length >
          0 && (
          <div className="space-y-2">
            {allSttProviders
              .filter((provider) => provider?.isCustom)
              .map((provider) => {
                const json = curl2Json(provider?.curl);

                return (
                  <Card
                    key={provider?.id}
                    className="p-3 border !bg-transparent border-input/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">
                          {json?.url || t("dev_space.stt_providers.invalid_curl_command")}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {`${t("dev_space.stt_providers.response_path_label")} ${
                              provider?.responseContentPath || t("dev_space.stt_providers.not_set")
                            }`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {" • "}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("dev_space.stt_providers.streaming")}: {provider?.streaming ? t("dev_space.stt_providers.streaming_yes") : t("dev_space.stt_providers.streaming_no")}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            provider?.id && handleEdit(provider?.id)
                          }
                          title={t("dev_space.stt_providers.edit_provider_title")}
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            provider?.id && handleDelete(provider?.id)
                          }
                          title={t("dev_space.stt_providers.delete_provider_title")}
                          className="text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
      <CreateEditProvider customProviderHook={customProviderHook} />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              {t("dev_space.stt_providers.delete_dialog_title")}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t("dev_space.stt_providers.delete_dialog_description")}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                {t("common.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
