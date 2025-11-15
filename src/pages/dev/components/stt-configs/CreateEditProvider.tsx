import {
  Card,
  Button,
  Header,
  TextInput,
  Switch,
  Textarea,
  Selection,
} from "@/components";
import { PlusIcon, SaveIcon } from "lucide-react";
import { useCustomSttProviders } from "@/hooks";
import { useApp, useTranslation } from "@/contexts";
import { cn } from "@/lib/utils";

interface CreateEditProviderProps {
  customProviderHook?: ReturnType<typeof useCustomSttProviders>;
}

export const CreateEditProvider = ({
  customProviderHook,
}: CreateEditProviderProps) => {
  const { t } = useTranslation();
  const { allSttProviders } = useApp();
  // Use the provided hook instance or create a new one
  const hookInstance = customProviderHook || useCustomSttProviders();

  const {
    showForm,
    setShowForm,
    editingProvider,
    formData,
    setFormData,
    errors,
    handleSave,
    setErrors,
    handleAutoFill,
  } = hookInstance;

  return (
    <>
      {!showForm ? (
        <Button
          onClick={() => {
            setShowForm(true);
            setErrors({});
          }}
          variant="outline"
          className="w-full h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {t("dev_space.stt_providers.add_custom")}
        </Button>
      ) : (
        <Card className="p-4 border border-input/50 bg-transparent">
          <div className="flex justify-between items-center">
            <Header
              title={
                editingProvider
                  ? t("dev_space.stt_providers.edit_title")
                  : t("dev_space.stt_providers.add_title")
              }
              description={t("dev_space.stt_providers.add_description")}
            />
            <div className="w-[120px]">
              <Selection
                options={allSttProviders
                  ?.filter((provider) => !provider?.isCustom)
                  .map((provider) => {
                    return {
                      label: provider?.id || "STT Provider",
                      value: provider?.id || "STT Provider",
                    };
                  })}
                placeholder={t("dev_space.stt_providers.auto_fill")}
                onChange={(value) => {
                  handleAutoFill(value);
                }}
              />
            </div>
          </div>

          <div className="">
            {/* Basic Configuration */}
            <div className="space-y-1">
              <Header
                title={t("dev_space.stt_providers.curl_command")}
                description={t("dev_space.stt_providers.curl_description")}
              />
              <Textarea
                className={cn(
                  "h-74 font-mono text-sm",
                  errors.curl && "border-red-500"
                )}
                placeholder={`curl -X POST "https://api.openai.com/v1/audio/transcriptions" \\
      -H "Authorization: Bearer {{API_KEY}}" \\
      -F "file={{AUDIO}}" \\
      -F "model={{MODEL}}"`}
                value={formData.curl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, curl: e.target.value }))
                }
              />
              {errors.curl && (
                <p className="text-xs text-red-500 mt-1">{errors.curl}</p>
              )}

              {/* Variable Instructions */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="bg-card border p-3 rounded-lg">
                  <p className="text-sm font-medium text-primary mb-2">
                    {t("dev_space.stt_providers.important_note")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("dev_space.stt_providers.important_description")}{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{MODEL}}"}
                    </code>{" "}
                    {t("dev_space.stt_providers.important_description_2")}
                  </p>
                </div>

                <h4 className="text-sm font-semibold text-foreground">
                  {t("dev_space.stt_providers.required_variables")}
                </h4>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
                    <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                      {"{{AUDIO}}"}
                    </code>
                    <span className="text-foreground font-medium">
                      {t("dev_space.stt_providers.audio_variable")}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{t("dev_space.stt_providers.quick_setup")}</strong>{" "}
                    {t("dev_space.stt_providers.quick_setup_description")}{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      YOUR_API_KEY
                    </code>{" "}
                    {t("dev_space.stt_providers.quick_setup_description_2")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      {t("dev_space.stt_providers.custom_variables")}
                    </strong>{" "}
                    {t("dev_space.stt_providers.custom_variables_description")}{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{VARIABLE_NAME}}"}
                    </code>{" "}
                    {t("dev_space.stt_providers.custom_variables_description_2")}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {t("dev_space.stt_providers.tip_message")}{" "}
                    <code className="bg-muted px-1 rounded text-xs">
                      {"{{AUDIO}}"}
                    </code>{" "}
                    {t("dev_space.stt_providers.tip_message_2")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-0">
            <div className="flex justify-between items-center space-x-2">
              <Header
                title={t("dev_space.stt_providers.streaming")}
                description={t("dev_space.stt_providers.streaming_description")}
              />
              <Switch
                checked={formData.streaming}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    streaming: checked,
                  }))
                }
                disabled={true}
              />
            </div>
            <span className="text-xs italic text-red-500">
              {t("dev_space.stt_providers.streaming_not_supported")}
            </span>
          </div>
          {/* Response Configuration */}
          <div className="space-y-2">
            <Header
              title={t("dev_space.stt_providers.response_path")}
              description={t("dev_space.stt_providers.response_path_description")}
            />

            <TextInput
              placeholder={t("dev_space.stt_providers.response_path_placeholder")}
              value={formData.responseContentPath || ""}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  responseContentPath: value,
                }))
              }
              error={errors.responseContentPath}
              notes={t("dev_space.stt_providers.response_path_notes")}
            />
          </div>

          <div className="flex justify-end gap-2 -mt-3">
            <Button
              variant="outline"
              onClick={() => setShowForm(!showForm)}
              className="h-11 border-1 border-input/50 focus:border-primary/50 transition-colors"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.curl.trim()}
              className={cn(
                "h-11 border-1 border-input/50 focus:border-primary/50 transition-colors",
                errors.curl && "bg-red-500 hover:bg-red-600 text-white"
              )}
            >
              {errors.curl ? (
                t("dev_space.stt_providers.invalid_curl")
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {editingProvider ? t("dev_space.stt_providers.update_provider") : t("dev_space.stt_providers.save_provider")}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
